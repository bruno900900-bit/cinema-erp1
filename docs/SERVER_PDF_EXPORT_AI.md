# Server-side PDF Export + AI Enrichment

## Overview

Adds two new endpoints:

- `POST /api/v1/presentations/enrich` – Optional AI enhancement of titles, notes, captions.
- `POST /api/v1/presentations/export` – Generates PDF via Playwright (if enabled) or returns HTML fallback.

## Environment Variables

| Variable             | Purpose                                            | Required | Default         |
| -------------------- | -------------------------------------------------- | -------- | --------------- |
| `OPENAI_API_KEY`     | Enables AI enrichment (OpenAI ChatCompletion)      | No       | _disabled_      |
| `OPENAI_MODEL`       | Model name (e.g. `gpt-3.5-turbo`)                  | No       | `gpt-3.5-turbo` |
| `PLAYWRIGHT_ENABLED` | If `1`, backend attempts HTML->PDF with Playwright | No       | _html fallback_ |

## Installation (Server PDF)

```bash
pip install jinja2 playwright
playwright install chromium
# Optional: freeze
pip freeze | grep -E "jinja2|playwright" >> requirements.txt
```

## Example Enrichment Request

```json
POST /api/v1/presentations/enrich
{
  "presentation": {
    "cover": {"enabled": true, "title": "Projeto X"},
    "summary": {"enabled": true},
    "pages": [
      {"id": "pg_1", "layout": "single", "title": "Sala Principal", "notes": "", "photoIds": ["1"]}
    ],
    "photos": [{"id": "1", "caption": ""}]
  },
  "options": {"improveTitles": true, "generateNotes": true, "fillMissingCaptions": true, "executiveSummary": true}
}
```

Response includes modified fields and `meta.ai_enriched` flag.

## Example Export Request

```json
POST /api/v1/presentations/export
{
  "presentation": { ...same structure... },
  "exportOptions": {"useAI": true, "theme": "default"}
}
```

- With `PLAYWRIGHT_ENABLED=1`: returns `application/pdf` stream (attachment header).
- Without: JSON fallback `{ status: "html-fallback", html: "...", pdf_base64: "..." }`.

## Frontend Usage (TypeScript)

```ts
import {
  exportServerPresentation,
  enrichPresentation,
} from "./src/services/presentationEnrichmentService";

// 1. Optional enrichment first
const enriched = await enrichPresentation(presentation, {
  executiveSummary: true,
});

// 2. Export server-side
const blob = await fetch("/api/v1/presentations/export", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    presentation: enriched,
    exportOptions: { useAI: false },
  }),
}).then((r) => r.blob());

// 3. Download
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "apresentacao.pdf";
a.click();
```

## Fallback Handling

If response is JSON with `status=html-fallback`, you can:

1. Take `html` and open in a new window for print-to-PDF client side.
2. Decode `pdf_base64` (may just be HTML bytes) to debug.

## Roadmap Enhancements

- Theming (`theme` param selects different CSS blocks).
- Watermark / footer branding.
- Internal links in Sumário (anchors) + clickable.
- Caching identical presentations (hash of payload) to speed repeated exports.
- Async background job for large sets (notify user when ready).

## Troubleshooting

| Issue                  | Cause                                   | Action                               |
| ---------------------- | --------------------------------------- | ------------------------------------ |
| Returned html-fallback | Playwright not installed or var not set | Install & set `PLAYWRIGHT_ENABLED=1` |
| AI fields unchanged    | `OPENAI_API_KEY` missing or model error | Check key, logs, reduce payload size |
| Slow export            | First Chromium launch cold start        | Keep warm (reuse playwright context) |

## Security Notes

- Do not log full AI prompt in production (may contain sensitive names).
- Enforce maximum counts: pages ≤ 100, photos ≤ 400 (add guards if needed).
- Consider auth/role check before enabling AI (cost control).

---

Generated integration doc for new feature.
