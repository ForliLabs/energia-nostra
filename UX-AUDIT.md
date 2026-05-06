# UX Audit — EnergiaNostra

## Scope
Audit of public pages, dashboard flows, information architecture, loading/error handling, responsiveness, accessibility, forms, and first-run experience.

## Executive summary
The product had a strong visual direction but several high-friction issues: oversized dashboard navigation, inconsistent loading/error states, weak empty states, mock-backed pages, and onboarding/forms that exposed demo assumptions. The remediation work focused on shared UX primitives, safer navigation, better accessibility, DB-backed pages, and clearer first-run behavior.

## Findings

### 🔴 Critical
1. **Dashboard navigation was too dense and hard to scan**  
   A long flat sidebar made core tasks difficult to find, especially on laptop/mobile.
2. **Key dashboard pages lacked resilient loading and error handling**  
   Users could hit abrupt failures or blank states without recovery paths.
3. **Public onboarding and member flows depended on demo assumptions**  
   The login page exposed demo credentials, the portal used a hardcoded member, and the assessment flow showed prefilled results.

### 🟡 High impact
1. **Inconsistent empty states across data-heavy pages**  
   Multiple pages assumed data existed and degraded poorly for new CERs.
2. **Accessibility gaps in charts and navigation**  
   Interactive navigation and charts lacked clear semantics and assistive summaries.
3. **Mixed interaction patterns across pages**  
   Headers, actions, feedback, and spacing varied from page to page.
4. **Homepage CTAs and footer details were incomplete**  
   Internal links used plain anchors and legal/footer trust signals were missing.
5. **Forms needed better validation and feedback**  
   Login/registration/assessment flows did not guide users before API failure.

### 🟢 Polish
1. Navbar mobile controls needed stronger ARIA support.
2. Several pages duplicated formatting utilities instead of using shared helpers.
3. First-run pages needed clearer guidance when no records were present.

## Remediation implemented
- Added shared UX primitives:
  - `src/components/ui/toast-provider.tsx`
  - `src/components/ui/page-header.tsx`
  - `src/components/ui/skeleton.tsx`
  - `src/components/ui/empty-state.tsx`
- Added global providers and safer shell behavior in `src/app/layout.tsx`.
- Added global/dashboard error boundaries and dashboard loading state:
  - `src/app/error.tsx`
  - `src/app/dashboard/error.tsx`
  - `src/app/dashboard/loading.tsx`
- Rebuilt dashboard IA and navigation in grouped sections with search and mobile drawer:
  - `src/components/dashboard.tsx`
  - `src/app/dashboard/layout.tsx`
- Improved accessibility:
  - skip-link and `main-content` targets
  - better navbar ARIA
  - accessible chart wrappers and summaries in `src/components/charts/energy-charts.tsx`
- Standardized headers/empty states and moved key pages to async DB-backed rendering:
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboard/energy/page.tsx`
  - `src/app/dashboard/governance/page.tsx`
  - `src/app/dashboard/incentives/page.tsx`
  - `src/app/portale/page.tsx`
  - `src/app/page.tsx`
- Improved onboarding/forms:
  - login and registration validation + toast feedback
  - demo credentials only shown in demo mode
  - assessment starts without pre-rendered results and validates required input
- Replaced internal `<a>` CTAs with `next/link` on public marketing pages.
- Added privacy / terms / cookie links in footer.

## Residual UX recommendations
1. Add toast-based success/error handling on remaining dashboard mutation pages (`billing`, `notifications`, `storage`, `voting`, `gse-reports`).
2. Add keyboard/focus affordances to any remaining clickable cards/rows.
3. Add richer empty-state actions on all admin/reporting screens.
4. Add Playwright coverage for first-run UX flows and mobile navigation.

## Outcome
The app now has a more navigable dashboard, better first-run behavior, stronger accessibility semantics, clearer feedback, and a more consistent UI system. Remaining UX work is primarily page-by-page polish rather than structural redesign.
