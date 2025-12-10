# Post-Deploy Validation Checklist (Firebase Hosting + Cloud Run Backend)

## 1. Hosting & Routing

- [ ] Open https://palaoro-production.web.app and ensure app loads without console errors.
- [ ] Navigate to any client-side route (e.g., /locations) and refresh (no 404 from hosting).
- [ ] Verify rewrite: curl https://palaoro-production.web.app/api/v1/health returns JSON with expected structure.

## 2. HTTPS / Mixed Content

- [ ] Open browser DevTools > Network: confirm no requests use http:// (all upgraded to https://).
- [ ] No CSP upgrade-insecure-requests violations reported.

## 3. API Functionality

- [ ] List locations endpoint works.
- [ ] Create/update endpoints (if auth) succeed and return JSON (not HTML fallback).
- [ ] Error responses have proper JSON error body (no stack traces leaked).

## 4. Authentication

- [ ] Login / Logout flow works via Firebase Auth.
- [ ] Protected actions require auth (403/401 when unauthenticated).
- [ ] Admin-specific actions unlocked for admin role.

## 5. Photo System

- [ ] Upload a location photo → thumbnail generated if applicable.
- [ ] Gallery lightbox opens and keyboard navigation works.
- [ ] Drag-and-drop ordering persists in local storage/context.

## 6. Presentation Builder (Client PDF)

- [ ] Local PDF export downloads with cover & summary (if enabled).
- [ ] TOC page numbering correct; multi-layout pages render.
- [ ] AI enrich button disabled if OPENAI_API_KEY not set server-side.

## 7. Server Export (Cloud Run)

- [ ] /api/v1/presentations/export returns application/pdf when PLAYWRIGHT_ENABLED=1.
- [ ] Fallback JSON+base64 when PLAYWRIGHT_ENABLED not set.
- [ ] Anchors in TOC clickable in PDF (if PDF preserves links) or HTML fallback.
- [ ] Dark theme export test (send exportOptions.theme=dark) applies dark palette.

## 8. AI Enrichment

- [ ] POST /api/v1/presentations/enrich returns enriched fields with meta.ai_enriched=true when OPENAI_API_KEY configured.
- [ ] Graceful fallback (original data, ai_enriched=false) when key missing.

## 9. Firestore & Storage Security

- [ ] Attempt unauthorized write to protected collection: rejected.
- [ ] Public read of allowed collection (locations) succeeds.
- [ ] Storage public read of location photo works; private user path protected.

## 10. Performance & Scaling

- [ ] First byte latency acceptable (< 600ms) for health and a representative data endpoint.
- [ ] No unexpected cold start penalties after short idle window.

## 11. Logs & Monitoring

- [ ] Cloud Run logs show structured request logs, no tracebacks.
- [ ] Firebase console Hosting logs show 200 for SPA route refreshes.

## 12. Environment Variables

- [ ] DATABASE_URL points to production DB (not sqlite fallback).
- [ ] SECRET_KEY rotation policy documented.
- [ ] OPENAI_API_KEY present only in secure environment (not frontend exposed).

## 13. Error Handling

- [ ] Force a 404 → JSON error body with detail field.
- [ ] Force validation error → structured response (e.g., FastAPI validation schema).

## 14. CORS

- [ ] If accessing API from custom domain, preflight (OPTIONS) responses correct.

## 15. Rollback Plan

- [ ] Previous working image tag recorded.
- [ ] Command documented: gcloud run deploy cinema-backend --image <previous-tag>.

---

Document results and sign off once all checks pass.
