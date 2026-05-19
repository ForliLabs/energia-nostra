---
id: billing-and-incentives
title: Billing & incentives
description: Distribute GSE incentives to members, generate invoices, and execute payments via Stripe, PagoPA and SEPA.
---

# Billing & incentives

By the time you reach this guide you have meter data flowing in and
`SharingBalance` rows being produced. Now turn those into money in members'
accounts.

## The monthly cycle

```mermaid
flowchart LR
    SB[SharingBalance<br/>(per month)] --> Dist[Distribute incentive]
    Dist --> MP[MemberPayout rows]
    MP --> Inv[Generate invoices]
    Inv --> Pay[Run payments]
    Pay --> Stripe[Stripe payouts]
    Pay --> PagoPA[PagoPA notices]
    Pay --> SEPA[SEPA bank file]
    Stripe --> Reconc[Reconcile]
    PagoPA --> Reconc
    SEPA --> Reconc
```

Each step is a separate API endpoint, so you can run them on a cron, from CI, or
manually for the first few months.

## 1. Distribute the incentive

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/incentives/distribute \
  -H 'Content-Type: application/json' \
  -d '{"period":"2025-04","rule":"pro-rata-shared"}'
```

This creates one `MemberPayout` per active member. Distribution rules are
documented in [Energy sharing → Distribution rules](../concepts/energy-sharing#distribution-rules).

## 2. Generate invoices

CERs in Italy must issue *fatture elettroniche* through the SDI. EnergiaNostra
produces the FatturaPA XML and submits it:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/billing/invoices/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "cerId": "cer-bertinoro",
    "period": "2025-04",
    "issueDate": "2025-05-05"
  }'
```

Each invoice references the `MemberPayout` it materialises and is linked to
`Document` (the signed PDF) and `GseSubmission` (the SDI receipt).

:::tip Public-entity members
When a member is a *pubblica amministrazione* (e.g. the Comune), the invoice goes
to **PagoPA**, not the standard SDI flow. EnergiaNostra detects this by VAT
prefix (`IT8...` or fiscal code with public-body pattern).
:::

## 3. Run payments

Now move the money:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/billing/run \
  -H 'Content-Type: application/json' \
  -d '{"cerId":"cer-bertinoro","period":"2025-04"}'
```

EnergiaNostra picks the right rail per member:

| Member's preferred payout method | Rail used |
|---|---|
| `iban` | SEPA Credit Transfer (XML pain.001) |
| `stripe_connect` | Stripe Connect payout |
| `pagopa` | PagoPA notice (for inbound payments from PA) |
| `wallet` | Internal wallet credit (for CERs running an internal ledger) |

Response:

```json
{
  "executed": 6,
  "failed": 0,
  "totalEur": 353.62,
  "sepaFile": "/api/billing/exports/sepa-2025-04.xml",
  "stripePayouts": ["po_1Nx...", "po_1Ny..."]
}
```

The SEPA file is in the standard `pain.001.001.09` format — upload it to your bank
or have EnergiaNostra push it automatically if you've configured your bank's API.

## 4. Reconcile

Reconciliation closes the loop: did the money actually arrive?

- **Stripe** webhooks (`payout.paid`, `payout.failed`) update `Payment.status`
  automatically.
- **SEPA** statements can be imported (CAMT.053 XML):

  ```bash
  curl -b cookies.txt -X POST \
    http://localhost:3000/api/billing/reconcile/sepa \
    -F "file=@camt053-2025-05.xml"
  ```

- **PagoPA** receipts arrive on the `pagopa.payment_received` webhook.

The **Dashboard → Finance → Reconciliation** view shows any payout still in
`pending` after 5 working days — your cue to investigate.

## Pricing and tariffs

The GSE tariff (`€110/MWh` as of 2025) is configurable per CER and per period:

```bash
curl -b cookies.txt -X PUT \
  http://localhost:3000/api/cer/cer-bertinoro/tariff \
  -H 'Content-Type: application/json' \
  -d '{
    "effectiveFrom": "2025-01-01",
    "eurPerKwh": 0.110,
    "source": "GSE-TIAD-2024"
  }'
```

When ARERA updates the tariff, post a new entry — historical periods continue to
use the tariff that was effective on their first day.

## Certificazione Unica

At year-end, each member needs a Certificazione Unica documenting the income they
received from the CER. Generate the full batch:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/billing/certificazione-unica \
  -H 'Content-Type: application/json' \
  -d '{"cerId":"cer-bertinoro","year":2025}'
```

This returns a ZIP with one PDF per member plus the aggregate XML required for
*Agenzia delle Entrate* submission.

## Common pitfalls

- **Not setting per-member payout method**: defaults to "manual hold" — payouts
  stack up until the member chooses a method.
- **Period mismatch**: invoices must be issued in the calendar month *after* the
  period they cover, or risk SDI rejection.
- **Rounding**: EnergiaNostra rounds every payout to the cent. Totals reconcile
  to the incentive within ±€0.01 — that residue goes to a dedicated
  `RoundingMember` account by convention.

## Audit trail

Every step writes an `AuditEvent`:

```bash
curl -b cookies.txt \
  "http://localhost:3000/api/audit?cerId=cer-bertinoro&period=2025-04"
```

You'll see one row per `incentives.distribute`, `invoices.generate`, `billing.run`
call, with actor, timestamp, IP, and the resulting object IDs. This is what an
ARERA auditor will ask for.
