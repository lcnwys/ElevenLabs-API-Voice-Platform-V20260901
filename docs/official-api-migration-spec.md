# Official ElevenLabs API migration

## Goal

Make the application a strict ElevenLabs API console. Requests must use the configured official API (or the explicitly configured compatible base URL), and the application must never fabricate voices, models, audio, history, workspace resources, agents, PVC slots, or billing data.

## Scope

- Remove simulator state, seeded demo records, Google TTS/audio synthesis, and success fallbacks from `server.ts`.
- Preserve the existing `/api/*` frontend adapter routes where their behavior maps cleanly to an official API.
- Return the upstream status and JSON/text error when ElevenLabs fails.
- Update Voice Design to the current Text-to-Voice endpoints.
- Update Dubbing to the current project-based API contract, or explicitly return `501` for UI operations that have no official equivalent rather than simulating them.
- Keep binary media responses as binary and pass through upstream content type.
- Make status report configuration only; it must not claim simulator mode.

## Billing and usage design

- Subscription state comes from `GET /v1/user/subscription`, including character balance, overage state, open invoices, and next invoice when the account exposes them.
- Usage comes from `POST /v1/workspace/analytics/query/usage-by-product-over-time` and is displayed as the official response table, without converting usage into an invented USD amount.
- API request activity comes from `POST /v1/workspace/analytics/requests`; request logs do not contain invoice line-item prices, so they are not presented as billing totals.
- Audit data comes from `GET /v1/workspace/audit-logs` and remains permission/plan controlled by ElevenLabs.
- The UI must explicitly state that invoice history and line-item billing are available in the ElevenLabs Subscription dashboard, not claim that the public API provides them.
- Any model price calculator is an estimate/reference only and must be visually separated from official account data.

## Non-goals

- Rebuilding the UI from scratch.
- Inventing a database for persistence.
- Making unsupported Enterprise/PVC features appear available.

## Acceptance checks

- With no API key, every official-data route returns a clear `503`/`401`, never seeded data or generated audio.
- With an API key, upstream non-2xx responses retain an appropriate error status and JSON/text body.
- No runtime path references simulator/mock/fallback/Google TTS data generation.
- TypeScript check, Vite production build, and `git diff --check` pass.
- `/api/status` reports `configured`, `baseUrl`, and API mode without a simulator state.
