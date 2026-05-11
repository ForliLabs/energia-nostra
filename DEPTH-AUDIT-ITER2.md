# Depth Audit Iteration 2 — EnergiaNostra

## Scope
Focused re-audit of implementation depth across auth/session handling, API consistency, billing, voting, documents, storage, security hardening, and validation coverage after iteration 1.

## Executive summary
The largest remaining depth issues after iteration 1 were no longer cosmetic. Several core user journeys still depended on mismatched auth paths, in-memory business logic, permissive defaults, or hardcoded identities. Iteration 2 concentrated on removing those hidden demo assumptions so the UI improvements sit on top of more credible backend behavior.

## New findings

### 🔴 Priority 0
1. **Primary auth routes still diverged from the production auth stack**  
   Login, registration, session, refresh, and logout behavior were not consistently using the DB-backed production auth implementation.
2. **Billing and voting were still backed by demo/in-memory domain logic**  
   Core cooperative actions could appear to work without persisting or reflecting real database state.
3. **Portal/session resolution could expose the wrong user context**  
   Falling back to the first member when a session was missing or unmatched was a correctness and privacy risk.

### 🟡 Priority 1
1. **Documents workflow still contained hardcoded/default assumptions**  
   Template generation and signing flows could fall back to static CER behavior and weak OTP generation.
2. **Storage configuration failed open**  
   The storage layer tolerated placeholder credentials/defaults, which masked misconfiguration and made runtime behavior misleading.
3. **Payments/invoices/session authorization paths were inconsistent**  
   CER resolution and role-aware access checks needed to be consolidated instead of relying on partial assumptions.

### 🟢 Priority 2+
1. Test coverage was still thin around the newly hardened billing/documents/storage helper logic.
2. Some operational APIs still need further end-to-end coverage for permission edges and multi-CER isolation.
3. Storage still needs true production-grade signed URL lifecycle coverage and integration validation against a real object store.

## Remediation implemented
- Added `src/lib/session.ts` to unify production and legacy session lookup, role checks, and CER resolution.
- Migrated auth endpoints to the production auth stack:
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/session/route.ts`
  - `src/app/api/auth/logout/route.ts`
  - `src/app/api/auth/refresh/route.ts`
- Replaced demo billing logic in `src/lib/billing.ts` with Prisma-backed invoice reads, summaries, and payment state updates.
- Replaced in-memory voting logic in `src/lib/voting.ts` with Prisma-backed ballots/results and real session-derived voter identity.
- Hardened `src/lib/documents.ts` by improving variable substitution/default filling, removing default CER dependence, and switching signature OTP generation to crypto-backed randomness.
- Hardened `src/lib/storage.ts` by requiring real configuration, surfacing configuration state, and adding safer object lookup helpers.
- Updated session-aware APIs to use the new access model:
  - `src/app/api/invoices/route.ts`
  - `src/app/api/payments/route.ts`
  - `src/app/api/votes/route.ts`
  - `src/app/api/documents/route.ts`
  - `src/app/api/storage/route.ts`
- Closed an authorization gap in storage deletion by validating category access before removing objects.
- Tightened payments list consistency by filtering payments with the active CER context.
- Expanded unit coverage with new/updated tests for billing, voting, documents, and storage helpers.

## Residual depth work required
1. Add route-level integration tests for auth cookie lifecycle, CER scoping, and role enforcement across the updated APIs.
2. Add integration coverage for storage presign/upload/download/delete behavior against a configured S3-compatible target.
3. Review remaining API handlers for older patterns that should adopt `src/lib/session.ts` and consistent CER-aware authorization.
4. Add audit trails or structured events for sensitive operational mutations such as invoice status changes, signature starts, and storage deletions.
5. Validate multi-tenant isolation more aggressively in payments/billing/reporting scenarios with mixed CER datasets.

## Validation
- `npm run lint` ✅ (warnings only; no errors)
- `npm run test` ✅ (`323/323` tests passed)
- `npm run build` ✅

## Outcome
Iteration 2 materially improved backend credibility. The app now relies far less on demo assumptions in auth, billing, voting, documents, and storage, and the updated UI flows rest on more consistent session and authorization behavior. The main remaining work is deeper integration coverage and production-hardening around external infrastructure, not basic domain correctness.