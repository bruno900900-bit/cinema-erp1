from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ....schemas.tag import TagCreate, TagUpdate, TagResponse
from ....services.tag_service import TagService
from ....core.database import get_db

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("/", response_model=List[TagResponse])
def get_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    kind: Optional[str] = Query(None, description="Filtrar por tipo de tag"),
    search: Optional[str] = Query(None, description="Buscar por nome"),
    db: Session = Depends(get_db)
):
    """Lista todas as tags com filtros opcionais"""
    try:
        tag_service = TagService(db)
        return tag_service.get_tags(skip=skip, limit=limit, kind=kind, search=search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tags: {str(e)}")

@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    """Obtém uma tag específica por ID"""
    try:
        tag_service = TagService(db)
        tag = tag_service.get_tag_by_id(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag não encontrada")
        return tag
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tag: {str(e)}")

@router.post("/", response_model=TagResponse)
def create_tag(tag_data: TagCreate, db: Session = Depends(get_db)):
    """Cria uma nova tag"""
    try:
        tag_service = TagService(db)
        return tag_service.create_tag(tag_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar tag: {str(e)}")

@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: int, tag_data: TagUpdate, db: Session = Depends(get_db)):
    """Atualiza uma tag existente"""
    try:
        tag_service = TagService(db)
        tag = tag_service.update_tag(tag_id, tag_data)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag não encontrada")
        return tag
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar tag: {str(e)}")

@router.delete("/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    """Remove uma tag"""
    try:
        tag_service = TagService(db)
        success = tag_service.delete_tag(tag_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tag não encontrada")
        return {"message": "Tag removida com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover tag: {str(e)}")

@router.get("/kind/{kind}", response_model=List[TagResponse])
def get_tags_by_kind(kind: str, db: Session = Depends(get_db)):
    """Lista tags por tipo"""
    try:
        tag_service = TagService(db)
        return tag_service.get_tags_by_kind(kind)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tags por tipo: {str(e)}")

@router.get("/search/name", response_model=List[TagResponse])
def search_tags_by_name(name: str = Query(..., description="Nome para buscar"), db: Session = Depends(get_db)):
    """Busca tags por nome (busca parcial)"""
    try:
        tag_service = TagService(db)
        return tag_service.search_tags_by_name(name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tags por nome: {str(e)}")

@router.get("/popular", response_model=List[TagResponse])
def get_popular_tags(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    """Lista as tags mais utilizadas"""
    try:
        tag_service = TagService(db)
        return tag_service.get_popular_tags(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tags populares: {str(e)}")

@router.get("/stats")
def get_tag_stats(db: Session = Depends(get_db)):
    """Obtém estatísticas das tags"""
    try:
        tag_service = TagService(db)
        return tag_service.get_tag_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")

