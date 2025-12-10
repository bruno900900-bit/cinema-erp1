from fastapi import APIRouter, Depends, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import io
import uuid
from datetime import datetime

from app.core.database import get_db
from app.schemas.presentation_export import PresentationExportRequest, PresentationExportResponse
from app.services.presentation_export_service import PresentationExportService
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/presentation", response_model=PresentationExportResponse)
async def export_presentation(
    request: PresentationExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exporta locações selecionadas para uma apresentação PowerPoint

    - **location_ids**: Lista de IDs das locações
    - **order**: Ordem desejada das locações na apresentação
    - **include_photos**: Se deve incluir fotos das locações
    - **include_summary**: Se deve incluir slide de resumo
    - **template_name**: Template de apresentação a ser usado
    """
    try:
        # Validar se a ordem tem o mesmo tamanho dos IDs
        if len(request.location_ids) != len(request.order):
            raise HTTPException(
                status_code=400,
                detail="A lista de ordem deve ter o mesmo tamanho da lista de IDs das locações"
            )

        # Validar se não há IDs duplicados
        if len(set(request.location_ids)) != len(request.location_ids):
            raise HTTPException(
                status_code=400,
                detail="IDs de locações duplicados não são permitidos"
            )

        # Validar se a ordem contém apenas valores válidos
        if not all(0 <= order < len(request.location_ids) for order in request.order):
            raise HTTPException(
                status_code=400,
                detail="Valores de ordem inválidos"
            )

        # Criar serviço de exportação
        export_service = PresentationExportService(db)

        # Gerar apresentação
        presentation_bytes = export_service.create_presentation(request)

        # Gerar nome único para o arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        filename = f"apresentacao_locacoes_{timestamp}_{file_id}.pptx"

        # Calcular tamanho do arquivo
        file_size = len(presentation_bytes)

        # Calcular total de slides (título + locações + resumo)
        total_slides = 1 + len(request.location_ids) + (1 if request.include_summary else 0)

        # Retornar resposta com informações do arquivo
        return PresentationExportResponse(
            success=True,
            message="Apresentação gerada com sucesso",
            file_name=filename,
            file_size=file_size,
            total_slides=total_slides,
            locations_included=len(request.location_ids),
            download_url=f"/api/export/download/{file_id}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar apresentação: {str(e)}"
        )


@router.get("/download/{file_id}")
async def download_presentation(
    file_id: str,
    location_ids: str = Query(..., description="IDs das locações separados por vírgula"),
    order: str = Query(..., description="Ordem das locações separada por vírgula"),
    include_photos: bool = Query(True, description="Incluir fotos"),
    include_summary: bool = Query(True, description="Incluir slide de resumo"),
    template_name: str = Query("default", description="Template da apresentação"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz download da apresentação gerada

    - **file_id**: ID único do arquivo
    - **location_ids**: IDs das locações separados por vírgula
    - **order**: Ordem das locações separada por vírgula
    - **include_photos**: Se deve incluir fotos
    - **include_summary**: Se deve incluir slide de resumo
    - **template_name**: Template da apresentação
    """
    try:
        # Converter strings para listas
        location_ids_list = [int(x.strip()) for x in location_ids.split(',')]
        order_list = [int(x.strip()) for x in order.split(',')]

        # Criar objeto de requisição
        request = PresentationExportRequest(
            location_ids=location_ids_list,
            order=order_list,
            include_photos=include_photos,
            include_summary=include_summary,
            template_name=template_name
        )

        # Validar dados
        if len(request.location_ids) != len(request.order):
            raise HTTPException(
                status_code=400,
                detail="A lista de ordem deve ter o mesmo tamanho da lista de IDs das locações"
            )

        if len(set(request.location_ids)) != len(request.location_ids):
            raise HTTPException(
                status_code=400,
                detail="IDs de locações duplicados não são permitidos"
            )

        if not all(0 <= order < len(request.location_ids) for order in request.order):
            raise HTTPException(
                status_code=400,
                detail="Valores de ordem inválidos"
            )

        # Criar serviço de exportação
        export_service = PresentationExportService(db)

        # Gerar apresentação
        presentation_bytes = export_service.create_presentation(request)

        # Gerar nome do arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"apresentacao_locacoes_{timestamp}_{file_id}.pptx"

        # Criar stream de resposta
        stream = io.BytesIO(presentation_bytes)

        # Retornar arquivo para download
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(presentation_bytes))
            }
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Formato inválido para IDs ou ordem: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao fazer download da apresentação: {str(e)}"
        )


@router.post("/presentation/download")
async def export_and_download_presentation(
    request: PresentationExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exporta e faz download direto da apresentação

    Esta é a versão mais simples que combina exportação e download em uma única chamada
    """
    try:
        # Validar dados da requisição
        if len(request.location_ids) != len(request.order):
            raise HTTPException(
                status_code=400,
                detail="A lista de ordem deve ter o mesmo tamanho da lista de IDs das locações"
            )

        if len(set(request.location_ids)) != len(request.location_ids):
            raise HTTPException(
                status_code=400,
                detail="IDs de locações duplicados não são permitidos"
            )

        if not all(0 <= order < len(request.location_ids) for order in request.order):
            raise HTTPException(
                status_code=400,
                detail="Valores de ordem inválidos"
            )

        # Criar serviço de exportação
        export_service = PresentationExportService(db)

        # Gerar apresentação
        presentation_bytes = export_service.create_presentation(request)

        # Gerar nome do arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"apresentacao_locacoes_{timestamp}.pptx"

        # Criar stream de resposta
        stream = io.BytesIO(presentation_bytes)

        # Retornar arquivo para download
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(presentation_bytes))
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar apresentação: {str(e)}"
        )
