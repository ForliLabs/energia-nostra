---
id: upload-meter-data
title: Upload meter data
description: Get smart-meter readings into EnergiaNostra reliably — CSV, XML, scheduled jobs, and the e-distribuzione API.
---

# Upload meter data

Energy sharing is only as good as the meter data behind it. This guide covers
every supported ingestion path and how to make it bullet-proof.

## Supported sources

| Source | Format | Latency | Effort to set up |
|---|---|---|---|
| Manual CSV upload | CSV (GSE standard) | Immediate | Lowest |
| Manual XML upload | XML (e-distribuzione export) | Immediate | Low |
| Scheduled SFTP pull | CSV/XML | Daily | Medium |
| **e-distribuzione API** | JSON | Near real-time | Highest (requires authorisation) |

Most CERs start with manual CSV uploads, then move to scheduled SFTP or the
e-distribuzione API once volumes justify it.

## CSV: the canonical format

```csv
pod,timestamp_iso,kwh_produced,kwh_consumed
IT001E12345678,2025-01-01T00:00:00Z,0.000,0.421
IT001E12345678,2025-01-01T00:15:00Z,0.000,0.382
IT001E12345678,2025-01-01T00:30:00Z,0.000,0.395
```

Rules:

- **One row per POD per 15-minute interval**.
- Timestamps in **ISO 8601, UTC**, with the `Z` suffix.
- Decimal separator is **`.`** (period), not comma.
- `kwh_produced` and `kwh_consumed` are non-negative floats with up to 3 decimals.
- Rows can be in any order; EnergiaNostra sorts at ingest.

Upload:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/meters/upload \
  -F "cerId=cer-bertinoro" \
  -F "period=2025-01" \
  -F "file=@january.csv"
```

Files up to **50 MB** are accepted synchronously. Larger files are queued and the
response returns a job ID:

```json
{ "uploadId": "upload-77f1", "status": "queued", "trackUrl": "/api/imports/upload-77f1" }
```

Poll `GET /api/imports/{id}` until `status: "imported"` or `"failed"`.

## XML: e-distribuzione export

If your distributor is e-distribuzione (≈85% of Italian PODs), the **Portale
Produttori** lets you download monthly XML. Upload it as-is:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/meters/upload \
  -F "cerId=cer-bertinoro" \
  -F "period=2025-01" \
  -F "format=edistribuzione-xml" \
  -F "file=@PROD_IT001E12345678_202501.xml"
```

EnergiaNostra parses the XML into the same canonical rows. Validation is
identical.

## Scheduled SFTP pulls

For monthly autopilot, have your distributor drop files on an SFTP endpoint
EnergiaNostra polls:

```yaml
# infra/helm/values.yaml (excerpt)
meterIngestion:
  sftp:
    enabled: true
    host: sftp.example.it
    port: 22
    username: cer-bertinoro
    privateKeySecret: meter-sftp-key
    remotePath: /uploads/
    schedule: "0 3 * * *"   # 03:00 daily
```

The cron job in `src/lib/meter-pipeline.ts` lists, downloads, ingests and archives
files. Failed files go into a quarantine folder and trigger an admin notification.

## e-distribuzione API (near real-time)

For pilots that want hourly data, e-distribuzione offers a REST API behind a
**delega** (authorisation) from each POD's owner. Once you have the delega:

```bash
# Configure once in .env
EDISTRIBUZIONE_CLIENT_ID=...
EDISTRIBUZIONE_CLIENT_SECRET=...
EDISTRIBUZIONE_DELEGA_TOKEN=...

# Enable polling
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/meter-source \
  -H 'Content-Type: application/json' \
  -d '{"source":"edistribuzione","cadence":"hourly"}'
```

EnergiaNostra polls hourly, dedupes against existing rows, and emits a webhook
on every successful ingest.

## Validation rules

Every row is run through `src/lib/meter-pipeline.ts` → `validateReading()`:

| Rule | Behaviour on violation |
|---|---|
| POD must exist as a `Plant` or `Member` POD in the CER | Reject row (`unknown_pod`) |
| `timestamp_iso` must parse | Reject row (`bad_timestamp`) |
| Values must be non-negative | Reject row (`negative_value`) |
| `(pod, timestamp)` must be unique within the period | Reject row (`duplicate`) |
| No gap > 1 hour in the day's readings | Day-level warning |

Rejected rows are stored in `ImportError`, never silently dropped. You can review
them at **Dashboard → Meters → Imports**.

## Re-importing

When you discover a bad CSV, just upload the corrected file. EnergiaNostra:

1. Marks the previous `MeterUpload` as `superseded`.
2. Replaces the affected rows transactionally.
3. Recomputes any `SharingBalance` that touched the period.
4. Emits `meter.reimport` webhook so downstream systems can react.

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/meters/upload \
  -F "cerId=cer-bertinoro" \
  -F "period=2025-01" \
  -F "file=@january-corrected.csv" \
  -F "supersedes=upload-77f1"
```

## Smoke-testing your pipeline

Once configured, run the daily smoke test:

```bash
curl -b cookies.txt http://localhost:3000/api/cer/cer-bertinoro/meters/health
```

```json
{
  "lastIngestAt": "2025-05-18T03:04:21Z",
  "coverage": { "2025-05": 0.998 },
  "stalePods": ["IT001E11223344"],
  "errors24h": 0
}
```

`coverage` is the fraction of expected (POD × interval) rows present. Below 95%
is a red flag — open an incident.

## Anti-patterns

- ❌ Uploading the **same month twice** without `supersedes=` — accepted but
  creates duplicate-row errors that pollute the dashboard.
- ❌ **Editing readings directly in the database** — bypasses the audit trail.
  Use the re-import flow.
- ❌ **Local-time timestamps** without `Z` — silently shifts every reading by 1–2
  hours and corrupts every subsequent sharing computation.
