from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from ....services.ai_enrichment import ai_enrichment_service
from ....services.presentation_renderer import build_presentation_pdf
from fastapi.responses import Response
import base64

router = APIRouter(tags=["presentations"])

class PhotoIn(BaseModel):
    id: str | int
    caption: Optional[str] = None

class PageIn(BaseModel):
    id: str
    layout: str = Field(pattern=r'^(single|two|grid4)$')
    title: Optional[str] = None
    notes: Optional[str] = None
    photoIds: List[str | int] = Field(default_factory=list, alias="photoIds")

class CoverIn(BaseModel):
    enabled: bool = False
    title: str = "Apresentação"
    subtitle: Optional[str] = None
    imageId: Optional[str | int] = Field(default=None, alias="imageId")

class SummaryIn(BaseModel):
    enabled: bool = False

class PresentationPayload(BaseModel):
    cover: Optional[CoverIn] = None
    summary: Optional[SummaryIn] = None
    pages: List[PageIn] = []
    photos: List[PhotoIn] = []
    meta: Dict[str, Any] | None = None

class EnrichmentOptions(BaseModel):
    improveTitles: bool = True
    generateNotes: bool = True
    fillMissingCaptions: bool = True
    executiveSummary: bool = False

class EnrichRequest(BaseModel):
    presentation: PresentationPayload
    options: EnrichmentOptions = EnrichmentOptions()

@router.post("/presentations/enrich")
async def enrich_presentation(req: EnrichRequest):
    payload = req.presentation.dict(by_alias=True)
    enriched = await ai_enrichment_service.enrich_presentation(payload, req.options.dict())
    return enriched

# Placeholder export route (will render HTML -> PDF in future implementation)
class ExportOptions(BaseModel):
    useAI: bool = False
    theme: Optional[str] = "default"

class ExportRequest(BaseModel):
    presentation: PresentationPayload
    exportOptions: ExportOptions = ExportOptions()

@router.post("/presentations/export")
async def export_presentation(req: ExportRequest):
    data = req.presentation.dict(by_alias=True)
    if req.exportOptions.useAI:
        data = await ai_enrichment_service.enrich_presentation(data, {
            "improveTitles": True,
            "generateNotes": True,
            "fillMissingCaptions": True,
            "executiveSummary": True
        })
    result = await build_presentation_pdf(data, { 'theme': req.exportOptions.theme })
    if result['is_pdf']:
        return Response(content=result['pdf'], media_type='application/pdf', headers={
            'Content-Disposition': 'attachment; filename="apresentacao.pdf"'
        })
    # Fallback: return HTML base64 if PDF não gerado
    encoded = base64.b64encode(result['pdf']).decode('utf-8')
    return {
        "status": "html-fallback",
        "message": "Playwright não habilitado. Ative PLAYWRIGHT_ENABLED=1 para PDF.",
        "html": result.get('html'),
        "pdf_base64": encoded,
        "presentation": data
    }
