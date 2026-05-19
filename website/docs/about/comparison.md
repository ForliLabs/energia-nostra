---
id: comparison
title: Why EnergiaNostra
description: How EnergiaNostra compares to spreadsheets, consulting firms, and other energy platforms.
---

# Why EnergiaNostra

CER management is a young market. Most communities running today juggle three or
four tools — a spreadsheet, the GSE portal, a PEC inbox, and a paid consultant.
EnergiaNostra is built to replace all of them with one open-source codebase.

## Side-by-side

| Capability | EnergiaNostra | Spreadsheets + GSE portal | Consulting firms | Generic energy platforms (Regalgrid, Enerbrain) |
|---|---|---|---|---|
| **Italian CER-native** (cabina primaria, SPID, GSE TIAD) | ✅ Native | ⚠️ Manual | ✅ Manual | ❌ Not modelled |
| **Onboarding with SPID/CIE** | ✅ Built in | ❌ | ❌ | ❌ |
| **Energy-sharing computation (GSE-TIAD)** | ✅ Automated, audited | ⚠️ Excel formulas | ✅ Manual | ⚠️ Generic |
| **Incentive distribution to members** | ✅ Pluggable rules | ⚠️ Excel formulas | ✅ Manual | ❌ |
| **Stripe + PagoPA + SEPA payouts** | ✅ All three | ❌ | ❌ | ⚠️ One vendor |
| **Digital voting with quorum** | ✅ | ❌ (paper) | ❌ | ❌ |
| **Bylaws templates + e-signature** | ✅ | ❌ | ✅ One-off | ❌ |
| **GSE portal submission** | ✅ Automated | ⚠️ Manual copy-paste | ✅ Manual | ❌ |
| **GDPR exports / erasure** | ✅ Endpoints | ❌ | ❌ | ⚠️ Partial |
| **Smart-meter ingestion (CSV/XML/API)** | ✅ All three | ⚠️ CSV only | ❌ | ✅ |
| **Multi-CER management** | ✅ | ❌ | ⚠️ Per project | ⚠️ Enterprise |
| **Open source (MIT)** | ✅ | n/a | ❌ | ❌ |
| **Self-hostable** | ✅ Docker, Helm, Terraform | n/a | ❌ | ❌ |
| **Per-CER monthly cost** | €0 (self-host) – €299 (hosted) | €0 cash + many hours | €5,000–15,000 setup | €500+/month enterprise |

## When to pick which

### Pick EnergiaNostra if…

- You want **one tool** for the whole CER lifecycle.
- You value being able to **read and modify the code** of the system that pays
  your members.
- You expect to **scale beyond one CER** (a municipality with multiple condominium
  CERs, a property administrator handling many buildings).
- You need **defensible audit trails** for ARERA, GSE or a *notaio*.
- You want to **integrate** with other systems (your accounting software, your
  IoT fleet, your data warehouse) via a typed REST API.

### Pick a spreadsheet if…

- Your CER has fewer than ~5 members.
- You're a single passionate volunteer and you enjoy the spreadsheet life.
- You never plan to grow.

You'll outgrow this when you get the first member complaint about a payout
calculation you can't reproduce.

### Pick a consulting firm if…

- You need **one-off legal help** standing up the legal entity. Many EnergiaNostra
  users use a *notaio* or a CER consultant for setup, then run the platform
  themselves.
- You don't have anyone technical at all in your community.

Use them for the legal setup, then move to EnergiaNostra for ongoing operations.

### Pick a generic energy platform if…

- You're running an **industrial-scale energy operation** that happens to have a
  CER attached.
- You need deep integration with a specific vendor's hardware.

These platforms tend to model CERs as an after-thought, and lock you into one
vendor.

## What we don't do (yet)

In the interest of honesty:

- **Hardware**: we don't sell meters, inverters, or batteries. We integrate with
  them.
- **Plant design**: we don't replace the engineering work of sizing a PV plant.
  We do show PVGIS-based yield estimates.
- **Legal advice**: the bylaws templates are vetted by lawyers, but for novel
  cases you still want a *notaio*.
- **Italian outside Italy**: we focus on the Italian RED II implementation.
  Spanish, French and German frameworks are on the [roadmap](./roadmap).

## Migration paths

### From a spreadsheet

1. Export your members as CSV (one column per field above).
2. Run `npm run db:reset` on a clean instance and use the bulk-invite endpoint.
3. Bulk-upload historical meter CSVs (one month at a time).
4. Run `sharing/compute` for each historical period and cross-check against your
   spreadsheet — discrepancies are usually rounding (we round at the cent; many
   spreadsheets round at the euro).

### From a generic energy platform

Use the platform's data export to produce GSE-standard CSV, then follow the
spreadsheet path above. Most CERs migrate one period at a time over a few weeks.
