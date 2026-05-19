---
id: energy-sharing
title: Energy sharing
description: How EnergiaNostra computes shared energy and the GSE incentive, with worked examples.
---

# Energy sharing

"Shared energy" is the kWh that the GSE pays for. It is **not** the total kWh
produced, and it is **not** the total kWh consumed. It is the overlap, computed
hour by hour, between what the CER's plants produce and what the CER's members
consume.

This page makes the maths concrete so you can audit any number EnergiaNostra
produces.

## The official definition (GSE-TIAD)

For each hour `h` and each CER:

```text
shared(h) = min( sum(produced_by_cer(h)) , sum(consumed_by_cer(h)) )
```

The monthly shared energy is the sum across hours:

```text
shared_month = Σ_h shared(h)
```

The incentive is then a flat tariff:

```text
incentive_eur = shared_month_kwh × tariff_eur_per_kwh
              = shared_month_kwh × 0.110   // €110/MWh as of 2025
```

EnergiaNostra applies the official **GSE TIAD methodology** (Testo Integrato
Autoconsumo Diffuso). The constant is in `src/lib/billing.ts` so it can be updated
when ARERA revises it.

## A worked example

Consider a 3-member CER with one PV plant over a single hour:

| Hour | Plant kWh | Member A kWh | Member B kWh | Member C kWh |
|---|---|---|---|---|
| 12:00 | 8.0 | 2.0 | 1.5 | 3.5 |

- Produced by CER: **8.0**
- Consumed by CER: 2.0 + 1.5 + 3.5 = **7.0**
- Shared(12:00) = `min(8.0, 7.0) = 7.0 kWh`
- Exported to grid: 8.0 − 7.0 = **1.0 kWh** (paid at wholesale, not the CER incentive)

Now the next hour:

| Hour | Plant kWh | A | B | C |
|---|---|---|---|---|
| 13:00 | 6.0 | 2.5 | 2.0 | 4.5 |

- Produced: 6.0
- Consumed: 9.0
- Shared(13:00) = `min(6.0, 9.0) = 6.0 kWh`
- The 3.0 kWh consumed beyond production is imported from the grid (paid at retail).

Across these two hours: `shared = 7.0 + 6.0 = 13.0 kWh`. At €0.110/kWh that's
**€1.43** in GSE incentive — which then gets distributed among A, B and C.

## Self-consumption vs sharing vs export

These three numbers must always add up:

```text
plant_production = self_consumed_at_pod + shared_in_cer + exported_to_grid
```

- **Self-consumed**: produced and consumed *at the same POD*. Earns nothing from
  the CER incentive (it's already free energy).
- **Shared in CER**: produced at one CER POD and consumed at *another* CER POD in
  the same hour. **This is what the GSE pays for.**
- **Exported**: produced energy that no CER member needed in that hour. Sold at
  the wholesale market price.

EnergiaNostra reports all three on every `SharingBalance`.

## Distribution rules

Once you have `incentive_eur` for the month, how do you split it among members?
The CER bylaws decide. EnergiaNostra ships four built-in rules:

| Rule | How it works | When to use |
|---|---|---|
| `pro-rata-shared` | Each member's payout is proportional to their consumption *during sharing hours*. | Most common; rewards aligning consumption with production. |
| `pro-rata-consumed` | Proportional to total monthly consumption. | When membership equality matters more than behaviour. |
| `equal-split` | Same amount to every active member. | Tiny CERs that prefer simplicity. |
| `weighted-stake` | Members hold "stake units"; payout follows units. | Cooperative CERs with capital contributions. |

Each rule is a function in `src/lib/billing.ts`:

```typescript
// Sketch of pro-rata-shared
export function distributeProRataShared(
  balance: SharingBalance,
  members: Member[],
): MemberPayout[] {
  const sharedByMember = members.map(m => ({
    memberId: m.id,
    consumedDuringSharing: sumConsumedDuringSharingHours(m, balance),
  }));
  const totalShared = sharedByMember.reduce((s, x) => s + x.consumedDuringSharing, 0);
  return sharedByMember.map(x => ({
    memberId: x.memberId,
    eur: round2(balance.incentiveEur * (x.consumedDuringSharing / totalShared)),
  }));
}
```

Custom rules are 20–40 lines. Add yours next to the others and register it in
`src/lib/billing.ts` → `DISTRIBUTION_RULES`.

## What about partial hours?

Smart meters report at 15-minute granularity. EnergiaNostra **aggregates to the
hour** before computing the GSE overlap — this is what the GSE itself does. If
you want a higher-resolution view (e.g. to choose when to run the dishwasher), the
**Dashboard → Energy → Heatmap** shows raw 15-minute data, but only hourly numbers
flow into `SharingBalance`.

## Edge cases that bite

| Edge case | What happens |
|---|---|
| Missing reading in the middle of the day | Linear interpolation between adjacent readings, capped at 1 hour. Beyond that, the gap is flagged and the period cannot be closed. |
| Negative `kwhProduced` | Quarantined at ingestion. |
| Plant POD also consumes (prosumer) | Self-consumption is netted out before the CER pool is computed. |
| New member joins mid-month | Only their readings *from `entryDate` onwards* enter the pool. |
| Daylight-saving transition | Stored in UTC; converted to Europe/Rome for reporting. |

## Recomputing safely

`SharingBalance` is **immutable**: each row carries a `methodology` field and a
`computedAt` timestamp. If you discover a bad CSV and re-import, EnergiaNostra
creates a *new* SharingBalance and supersedes the old one — the audit trail still
shows what was paid out and to whom.

```bash
# Force recompute (admin only)
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/sharing/recompute \
  -H 'Content-Type: application/json' \
  -d '{"period":"2025-01","reason":"Reimported January meters"}'
```

The previous `MemberPayout` rows remain visible with `status: "superseded"`.

## Further reading

- [GSE TIAD official text](https://www.arera.it/atti-e-provvedimenti/dettaglio/it/22-727) (ARERA, Italian).
- [Guides → GSE reporting](../guides/gse-reporting) — how this number is submitted.
- [Reference → API](../reference/api#cer--energy) — the `/sharing/*` endpoints.
