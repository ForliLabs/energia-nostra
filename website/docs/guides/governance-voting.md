---
id: governance-voting
title: Governance & voting
description: Run polls, track quorum, generate minutes — digital governance for your CER assembly.
---

# Governance & voting

A CER is a legal entity with a board and an assembly; decisions are made by vote
and recorded in *verbali* (minutes). EnergiaNostra digitises the entire flow.

## Three kinds of votes

| Vote type | Quorum | Who can vote | Example |
|---|---|---|---|
| **Board resolution** | Simple majority of board | Board members only | Approve a vendor invoice over €1,000 |
| **Ordinary assembly** | 50% of members + 1, then majority of votes cast | All active members | Approve annual financial report |
| **Extraordinary assembly** | Two-thirds of members | All active members | Amend the bylaws |

Quorum rules are encoded on each `Vote` row — you don't have to remember which
threshold applies.

## Create a vote

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/votes \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Approvazione bilancio 2024",
    "description": "Si approva il bilancio consuntivo dell esercizio 2024.",
    "voteType": "ordinary_assembly",
    "options": [
      { "label": "Approvo",     "value": "yes" },
      { "label": "Non approvo", "value": "no" },
      { "label": "Astenuto",    "value": "abstain" }
    ],
    "opensAt": "2025-05-20T18:00:00Z",
    "closesAt": "2025-05-27T18:00:00Z"
  }'
```

Members receive an in-app notification and an email with a deep link to the
ballot.

## Cast a ballot

Members vote from the dashboard or via API:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/votes/vote-bilancio-2024/cast \
  -H "X-CSRF-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"option":"yes"}'
```

Each ballot:

- Is tied to a `User` (one user, one vote per `Vote`).
- Carries a server-generated nonce so it can be verified post-hoc.
- Is **secret by default** — admins see counts, not who voted what. Set
  `secret: false` on the `Vote` for transparent voting.

## Tracking quorum

```bash
curl -b cookies.txt \
  http://localhost:3000/api/cer/cer-bertinoro/votes/vote-bilancio-2024 | jq
```

```json
{
  "id": "vote-bilancio-2024",
  "status": "open",
  "voteType": "ordinary_assembly",
  "quorumNeeded": 4,
  "ballotsCast": 5,
  "quorumMet": true,
  "tally": { "yes": 4, "no": 1, "abstain": 0 },
  "result": "pending_close"
}
```

When `closesAt` passes, `status` becomes `closed` and `result` becomes one of
`passed`, `failed`, or `inquorate`. The platform then generates a **verbale PDF**
listing the decision, the tally and the timestamps — signed with the CER's digital
certificate.

## Generating minutes

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/assemblies \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Assemblea ordinaria 27 maggio 2025",
    "votes": ["vote-bilancio-2024", "vote-budget-2025"],
    "secretary": "user-admin-1"
  }'
```

This produces a single PDF that bundles the agenda, all related votes, and a
participation list. It's archived in the CER's `Document` store and is what you
file with your *notaio* when amending bylaws.

## Announcements

Lower-stakes communication uses `Announcement`:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/announcements \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Manutenzione impianto domenica 25/05",
    "body": "Domenica 25 maggio dalle 09:00 alle 12:00 il PV sarà offline per manutenzione.",
    "pinned": true
  }'
```

Members see announcements on the dashboard home and (optionally) receive a push
notification.

## Delegations

Italian assembly rules allow members to delegate their vote to another member,
typically up to two delegations per delegate:

```bash
curl -b cookies.txt -X POST \
  http://localhost:3000/api/cer/cer-bertinoro/delegations \
  -H 'Content-Type: application/json' \
  -d '{
    "voteId": "vote-bilancio-2024",
    "delegateTo": "m-002",
    "delegatorSpidId": "TINIT-RSSMRA80A01H294X"
  }'
```

Delegations are signed via SPID/CIE so they're legally valid. The delegate's
ballot then counts twice (or three times) for that specific vote.

## What's recorded

Every governance action is on the audit trail with:

- Actor user ID
- IP address
- SPID/CIE assertion (if applicable)
- Ballot nonce
- Document hash

This is what makes EnergiaNostra's governance trail **defensible in front of
ARERA, GSE or a notaio**.
