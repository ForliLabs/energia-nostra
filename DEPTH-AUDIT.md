# Depth Audit — EnergiaNostra

## Scope
Audit of implementation depth across auth, data access, APIs, storage, reporting, billing, voting, and production-readiness.

## Executive summary
The codebase contained a capable UI shell, Prisma schema, and production-oriented modules, but important business paths still depended on demo logic, hardcoded CER identifiers, or in-memory behavior. The highest-priority work was reducing hardcoded defaults, moving core pages to DB-backed reads, improving route/runtime resilience, and documenting residual production gaps.

## Findings

### 🔴 Priority 0
1. **Demo auth remained wired in primary auth routes**  
   `src/lib/auth.ts` used static/demo patterns while `src/lib/auth-production.ts` existed but was not the active path.
2. **Hardcoded CER defaults were widespread**  
   Many paths assumed `cer-bertinoro`, reducing multi-tenant correctness.
3. **Mock data source was still used in user-facing pages**  
   `src/lib/data.ts` powered pages that should use Prisma-backed reads.
4. **Several domain flows still had demo/in-memory behavior**  
   Billing, voting, and storage included non-production shortcuts.

### 🟡 Priority 1
1. **Storage layer returned fake direct URLs / permissive defaults**  
   `src/lib/storage.ts` still needs true signed URL handling and stricter configuration.
2. **GSE reporting contained hardcoded business constants**  
   Static CER code/rates reduced traceability and correctness.
3. **Error handling and fallback behavior were uneven**  
   Some data/API paths still assumed happy-path availability.
4. **Route protection was only partially enforced in depth**  
   `src/proxy.ts` provides important protection, but deeper session validation still needs consolidation.

### 🟢 Priority 2+
1. Test coverage should increase around production auth, reporting, and no-data states.
2. Remaining page/API consumers should be migrated fully off mock/demo helpers.
3. Domain modules should converge on shared config and CER resolution helpers.

## Remediation implemented
- Introduced shared app config in `src/lib/app-config.ts`:
  - `DEFAULT_CER_ID`
  - `IS_DEMO_MODE`
  - `deriveCerCode`
- Reduced hardcoded CER assumptions by switching `src/lib/data-db.ts` defaults to `DEFAULT_CER_ID`.
- Extended DB-backed CER profile handling to surface `cabinaPrimaria`.
- Migrated key read paths from mock data to Prisma-backed `data-db`:
  - dashboard home
  - energy dashboard
  - governance dashboard
  - incentives dashboard
  - member portal
  - homepage content composition
- Removed hardcoded portal member selection and now resolve against the active session.
- Added resilient loading/error boundaries to reduce failure impact in production use.
- Updated chart/data presentation code to rely on shared formatting/utilities.

## Residual depth work required
1. **Complete auth route migration to `auth-production.ts`** and validate cookies/session lifecycle end-to-end.
2. **Replace demo/in-memory domain logic** in billing and voting with persisted Prisma-backed flows.
3. **Harden storage** with real signed URLs, required credentials, and safer error handling.
4. **Finish GSE refactor** so CER code and incentives derive from real CER/project data instead of static constants.
5. **Audit API handlers** for remaining unauthenticated or demo-default behavior.
6. **Expand test coverage** around auth, storage, reporting, and first-run/no-data states.

## Outcome
The app is materially closer to a real multi-tenant CER product: key dashboard reads now come from the database, hardcoded defaults are reduced, and shared config/fallback behavior is cleaner. The largest remaining gaps are backend depth and production hardening, not information architecture.
