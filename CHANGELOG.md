# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [Iteration 1] - 2026-05-15
### Added
- Repository governance files: MIT `LICENSE`, `.editorconfig`, and initial `CHANGELOG.md`.
- Advanced dashboard workflows for trading, forecasting, gamification, carbon credits, multi-CER, API platform, and developer platform.

### Changed
- Improved loading and error handling across advanced dashboard surfaces and their supporting APIs.
- Hardened session-aware API actions for API keys and webhooks so admin-only flows return explicit 401/403 responses.

### Fixed
- Resolved build-blocking TypeScript issues around nullable sessions and OpenAPI spec typing.

## [Iteration 2] - 2026-05-15
### Added
- Keyboard-driven dashboard command palette with quick navigation, section-aware search, and accessible listbox semantics.
- Search helpers and unit coverage for dashboard navigation filtering.

### Changed
- Upgraded dashboard navigation to surface shortcut guidance and quicker access on desktop and mobile.
- Improved accessibility with aria-live feedback, dialog labels, and keyboard traversal for rapid actions.

## [Iteration 3] - 2026-05-15
### Added
- Shared mutation security helpers for CSRF enforcement, rate limiting, and trusted external URL checks.
- Browser-side mutation header helper plus new unit coverage for security guard behavior.

### Changed
- Hardened advanced dashboard mutation routes with per-user rate limits, CSRF verification for production sessions, and stricter request validation.
- Updated dashboard write actions to include CSRF headers automatically when a production session is active.
