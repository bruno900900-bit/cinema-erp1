import os
from typing import List, Dict, Any

# Simple abstraction to allow plugging different AI providers later.
# Currently supports OpenAI (if OPENAI_API_KEY set) else returns input unchanged.

class AIEnrichmentService:
    def __init__(self):
        self.provider_key = os.getenv("OPENAI_API_KEY")
        self.enabled = bool(self.provider_key)
        # Lazy import to avoid dependency issues if key not provided

    async def enrich_presentation(self, payload: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich presentation fields (cover title/subtitle, page titles, notes, photo captions) using AI model.
        Falls back gracefully if AI not configured.
        Expected payload structure: {
          "cover": {"title": str, "subtitle": str|None},
          "pages": [{"id": str, "title": str|None, "notes": str|None, "layout": str}],
          "photos": [{"id": str|int, "caption": str|None, ...}],
          "summary": {"enabled": bool}
        }
        options: { improveTitles: bool, generateNotes: bool, fillMissingCaptions: bool, executiveSummary: bool }
        """
        if not self.enabled:
            # No AI key: return payload unchanged, mark flag
            payload.setdefault("meta", {})
            payload["meta"]["ai_enriched"] = False
            return payload

        try:
            import openai  # type: ignore
            openai.api_key = self.provider_key
        except Exception:
            payload.setdefault("meta", {})
            payload["meta"]["ai_enriched"] = False
            return payload

        # Build compact prompt
        instructions = [
            "Você é um assistente que melhora uma apresentação de locações para clientes corporativos.",
            "Responda SOMENTE JSON válido, mantendo todos os IDs.",
            "Campos: cover.title (≤60 chars), cover.subtitle (≤90 chars), pages[].title (≤50 chars), pages[].notes (≤180 chars).",
            "Se executar melhorias, não invente dados inexistentes sobre as fotos.",
        ]
        if options.get("improveTitles"): instructions.append("Melhore títulos mantendo sentido original.")
        if options.get("generateNotes"): instructions.append("Crie notas claras e concisas destacando valor da locação.")
        if options.get("fillMissingCaptions"): instructions.append("Preencha captions ausentes de forma descritiva curta.")
        if options.get("executiveSummary"): instructions.append("Adicione campo executive_summary (≤450 chars) em meta.")

        system_prompt = "\n".join(instructions)

        # Trim payload for prompt (avoid huge fields)
        trimmed = {
            "cover": {k: (v[:140] if isinstance(v, str) else v) for k,v in (payload.get("cover") or {}).items()},
            "pages": [
                {"id": p.get("id"), "title": (p.get("title") or '')[:120], "notes": (p.get("notes") or '')[:240], "layout": p.get("layout")} for p in payload.get("pages", [])
            ][:40],  # hard cap
            "photos": [
                {"id": ph.get("id"), "caption": (ph.get("caption") or '')[:120]} for ph in payload.get("photos", [])
            ][:80],
            "summary": payload.get("summary", {}),
        }

        import json
        user_content = json.dumps({"presentation": trimmed, "options": options}, ensure_ascii=False)

        try:
            completion = openai.ChatCompletion.create(
                model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.5,
                max_tokens=1200,
            )
            raw = completion.choices[0].message["content"] if completion.choices else None
            if not raw:
                return payload
            # attempt to parse
            enriched = json.loads(raw)
            # Merge back maintaining unknown future keys
            for key in ["cover", "pages", "photos", "summary"]:
                if key in enriched:
                    payload[key] = enriched[key]
            # meta
            payload.setdefault("meta", {})
            payload["meta"]["ai_enriched"] = True
            if "executive_summary" in (enriched.get("meta") or {}):
                payload["meta"]["executive_summary"] = enriched["meta"]["executive_summary"]
            return payload
        except Exception:
            payload.setdefault("meta", {})
            payload["meta"]["ai_enriched"] = False
            return payload

ai_enrichment_service = AIEnrichmentService()
