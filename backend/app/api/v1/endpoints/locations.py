from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from ....schemas.location import LocationCreate, LocationUpdate, LocationResponse
from ....schemas.location_search import LocationSearchRequest, LocationSearchResponse
from ....services.location_service import LocationService
from ....services.location_search_service import LocationSearchService
from ....core.database import get_db
from ....models.location import Location
from ....models.tag import Tag, LocationTag
from ....core.auth import get_current_user
from ....models.user import User

router = APIRouter(prefix="/locations", tags=["locations"])

@router.post("/", response_model=LocationResponse)
def create_location(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"📍 Locations: Recebida solicitação de criação de locação por {current_user.email}")
    """Cria uma nova locação (aceita camelCase ou snake_case)"""
    # Helpers: camelCase -> snake_case recursively
    import re

    def to_snake(s: str) -> str:
        s = s.replace("-", "_")
        return re.sub(r"(?<!^)(?=[A-Z])", "_", s).lower()

    def keys_to_snake(obj):
        if isinstance(obj, list):
            return [keys_to_snake(i) for i in obj]
        if isinstance(obj, dict):
            return {to_snake(k): keys_to_snake(v) for k, v in obj.items()}
        return obj

    data = keys_to_snake(payload or {})

    # Normalize enums/values
    if "status" in data and isinstance(data["status"], str):
        data["status"] = data["status"].lower()

    if "sector_type" in data and isinstance(data["sector_type"], str):
        data["sector_type"] = data["sector_type"].lower()

    # Map front-end space types to backend enum
    space_map = {
        "indoor": "studio",
        "outdoor": "outdoor",
        "studio": "studio",
        "location": "house",
        "room": "custom",
        "area": "custom",
    }
    if "space_type" in data and isinstance(data["space_type"], str):
        key = data["space_type"].lower()
        data["space_type"] = space_map.get(key, key)

    try:
        location_data = LocationCreate(**data)
    except Exception as e:
        # Return validation details
        raise HTTPException(status_code=422, detail=str(e))

    location_service = LocationService(db)
    return location_service.create_location(location_data)

@router.post("/with-photos", response_model=LocationResponse)
def create_location_with_photos(
    title: str = Form(...),
    summary: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: str = Form("draft"),
    sector_type: Optional[str] = Form(None),
    supplier_id: Optional[int] = Form(None),

    # Preços
    price_day_cinema: Optional[float] = Form(None),
    price_hour_cinema: Optional[float] = Form(None),
    price_day_publicidade: Optional[float] = Form(None),
    price_hour_publicidade: Optional[float] = Form(None),
    currency: str = Form("BRL"),

    # Endereço
    street: Optional[str] = Form(None),
    number: Optional[str] = Form(None),
    complement: Optional[str] = Form(None),
    neighborhood: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    country: str = Form("Brasil"),
    postal_code: Optional[str] = Form(None),

    # Contato
    supplier_name: Optional[str] = Form(None),
    supplier_phone: Optional[str] = Form(None),
    supplier_email: Optional[str] = Form(None),
    contact_person: Optional[str] = Form(None),
    contact_phone: Optional[str] = Form(None),
    contact_email: Optional[str] = Form(None),

    # Características
    space_type: Optional[str] = Form(None),
    capacity: Optional[int] = Form(None),
    area_size: Optional[float] = Form(None),
    power_specs: Optional[str] = Form(None),
    noise_level: Optional[str] = Form(None),
    acoustic_treatment: Optional[str] = Form(None),
    parking_spots: Optional[int] = Form(None),

    # Relacionamentos
    project_id: Optional[int] = Form(None),
    responsible_user_id: Optional[int] = Form(None),

    # Fotos
    photos: List[UploadFile] = File(default=[]),
    photo_captions: List[str] = Form(default=[]),
    primary_photo_index: Optional[int] = Form(None),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"📸 Locations: Recebida solicitação de criação com fotos por {current_user.email}")
    """Cria uma nova locação com fotos"""
    from ....services.photo_service import PhotoService
    from ....schemas.location import LocationStatus, SectorType, SpaceType

    # Convert string enums
    status_enum = None
    if status:
        try:
            status_enum = LocationStatus(status.lower())
        except ValueError:
            status_enum = LocationStatus.DRAFT

    sector_type_enum = None
    if sector_type:
        try:
            sector_type_enum = SectorType(sector_type.lower())
        except ValueError:
            sector_type_enum = None

    space_type_enum = None
    if space_type:
        space_map = {"indoor": "studio", "outdoor": "outdoor", "studio": "studio", "location": "house", "room": "custom", "area": "custom"}
        mapped = space_map.get(space_type.lower(), space_type.lower())
        try:
            space_type_enum = SpaceType(mapped)
        except ValueError:
            space_type_enum = None

    try:
        # Criar dados da localização
        location_data = LocationCreate(
            title=title,
            summary=summary,
            description=description,
            status=status_enum or LocationStatus.DRAFT,
            sector_type=sector_type_enum,
            supplier_id=supplier_id,
            price_day_cinema=price_day_cinema,
            price_hour_cinema=price_hour_cinema,
            price_day_publicidade=price_day_publicidade,
            price_hour_publicidade=price_hour_publicidade,
            currency=currency,
            street=street,
            number=number,
            complement=complement,
            neighborhood=neighborhood,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code,
            supplier_name=supplier_name,
            supplier_phone=supplier_phone,
            supplier_email=supplier_email,
            contact_person=contact_person,
            contact_phone=contact_phone,
            contact_email=contact_email,
            space_type=space_type_enum,
            capacity=capacity,
            area_size=area_size,
            power_specs=power_specs,
            noise_level=noise_level,
            acoustic_treatment=acoustic_treatment,
            parking_spots=parking_spots,
            project_id=project_id,
            responsible_user_id=responsible_user_id
        )
    except Exception as e:
        print(f"❌ Erro ao criar LocationCreate: {e}")
        raise HTTPException(status_code=422, detail=str(e))


    # Criar localização
    try:
        location_service = LocationService(db)
        location = location_service.create_location(location_data)
        print(f"✅ Locação criada com ID: {location.id}")
    except Exception as e:
        print(f"❌ Erro ao criar locação: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao criar locação: {str(e)}")

    # Upload das fotos
    if photos and len(photos) > 0:
        photo_service = PhotoService(db)

        for i, photo in enumerate(photos):
            if photo.filename:  # Verificar se é um arquivo válido
                caption = photo_captions[i] if i < len(photo_captions) else None
                is_primary = (i == primary_photo_index) if primary_photo_index is not None else (i == 0)

                try:
                    photo_service.upload_location_photo(
                        location_id=location.id,
                        file=photo,
                        caption=caption,
                        is_primary=is_primary
                    )
                except Exception as e:
                    print(f"Erro ao fazer upload da foto {i}: {e}")
                    # Continuar mesmo se uma foto falhar

    # Retornar localização com fotos
    try:
        return location_service.get_location(location.id)
    except Exception as e:
        print(f"❌ Erro ao buscar locação criada: {e}")
        return location


@router.get("/", response_model=List[LocationResponse])
def get_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Status da locação"),
    space_type: Optional[str] = Query(None, description="Tipo de espaço"),
    city: Optional[str] = Query(None, description="Cidade"),
    project_id: Optional[int] = Query(None, description="ID do projeto"),
    supplier_id: Optional[int] = Query(None, description="ID do fornecedor"),
    sector_type: Optional[str] = Query(None, description="Tipo de setor"),
    search: Optional[str] = Query(None, description="Termo de busca"),
    db: Session = Depends(get_db)
):
    """Lista locações com filtros básicos"""
    location_service = LocationService(db)
    return location_service.get_locations(
        skip=skip,
        limit=limit,
        status=status,
        space_type=space_type,
        city=city,
        project_id=project_id,
        supplier_id=supplier_id,
        sector_type=sector_type,
        search=search
    )

@router.post("/search", response_model=LocationSearchResponse)
def search_locations(
    search_request: LocationSearchRequest,
    db: Session = Depends(get_db)
):
    """Busca avançada de locações com filtros complexos"""
    search_service = LocationSearchService(db)
    return search_service.search_locations(search_request)

@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma locação específica"""
    location_service = LocationService(db)
    location = location_service.get_location(location_id)

    if not location:
        raise HTTPException(status_code=404, detail="Locação não encontrada")

    return location

@router.patch("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma locação existente"""
    location_service = LocationService(db)
    location = location_service.update_location(location_id, location_data)

    if not location:
        raise HTTPException(status_code=404, detail="Locação não encontrada")

    return location

@router.put("/{location_id}", response_model=LocationResponse)
def update_location_put(
    location_id: int,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma locação existente (método PUT)"""
    location_service = LocationService(db)
    location = location_service.update_location(location_id, location_data)

    if not location:
        raise HTTPException(status_code=404, detail="Locação não encontrada")

    return location

@router.delete("/{location_id}")
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove uma locação"""
    location_service = LocationService(db)
    success = location_service.delete_location(location_id)

    if not success:
        raise HTTPException(status_code=404, detail="Locação não encontrada")

    return {"message": "Locação removida com sucesso"}

@router.post("/{location_id}/photos")
def upload_location_photo(
    location_id: int,
    photo: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Faz upload de uma foto para a locação"""
    from ....services.photo_service import PhotoService

    photo_service = PhotoService(db)
    return photo_service.upload_location_photo(location_id, photo, caption, is_primary)

@router.get("/{location_id}/photos")
def get_location_photos(location_id: int, db: Session = Depends(get_db)):
    """Lista todas as fotos de uma locação"""
    from ....services.photo_service import PhotoService

    photo_service = PhotoService(db)
    return photo_service.get_location_photos(location_id)

@router.delete("/{location_id}/photos/{photo_id}")
def delete_location_photo(
    location_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove uma foto de uma locação"""
    from ....services.photo_service import PhotoService

    photo_service = PhotoService(db)
    return photo_service.delete_location_photo(location_id, photo_id)

@router.put("/{location_id}/photos/{photo_id}/cover")
def set_cover_photo(
    location_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Define uma foto como capa"""
    from ....services.photo_service import PhotoService

    photo_service = PhotoService(db)
    return photo_service.set_cover_photo(location_id, photo_id)

@router.post("/{location_id}/photos/reorder")
def reorder_photos(
    location_id: int,
    photo_orders: List[dict] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reordena as fotos de uma locação"""
    from ....services.photo_service import PhotoService

    photo_service = PhotoService(db)
    return photo_service.reorder_photos(location_id, photo_orders)

@router.post("/{location_id}/tags")
def add_location_tag(
    location_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona uma tag a uma locação"""
    # Verificar se a locação existe
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Locação não encontrada")

    # Verificar se a tag existe
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")

    # Verificar se a associação já existe
    existing = db.query(LocationTag).filter(
        LocationTag.location_id == location_id,
        LocationTag.tag_id == tag_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Tag já associada à locação")

    # Criar associação
    location_tag = LocationTag(location_id=location_id, tag_id=tag_id)
    db.add(location_tag)
    db.commit()

    return {"message": "Tag adicionada com sucesso", "tag": {"id": tag.id, "name": tag.name}}

@router.delete("/{location_id}/tags/{tag_id}")
def remove_location_tag(
    location_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove uma tag de uma locação"""
    # Buscar associação
    location_tag = db.query(LocationTag).filter(
        LocationTag.location_id == location_id,
        LocationTag.tag_id == tag_id
    ).first()

    if not location_tag:
        raise HTTPException(status_code=404, detail="Associação não encontrada")

    # Remover associação
    db.delete(location_tag)
    db.commit()

    return {"message": "Tag removida com sucesso"}

@router.get("/{location_id}/contracts", include_in_schema=False)
def get_location_contracts(location_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Endpoint não implementado")

@router.get("/{location_id}/visits", include_in_schema=False)
def get_location_visits(location_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Endpoint não implementado")

@router.post("/{location_id}/duplicate", include_in_schema=False)
def duplicate_location(location_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Endpoint não implementado")

@router.post("/{location_id}/archive", include_in_schema=False)
def archive_location(location_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Endpoint não implementado")

@router.post("/{location_id}/restore", include_in_schema=False)
def restore_location(location_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Endpoint não implementado")

@router.get("/stats/overview")
def get_locations_overview(db: Session = Depends(get_db)):
    """Obtém estatísticas gerais das locações"""
    from sqlalchemy import func, case

    # Total de locações
    total_locations = db.query(Location).count()

    # Por status
    by_status = db.query(
        Location.status,
        func.count(Location.id).label('count')
    ).group_by(Location.status).all()

    # Por tipo de espaço
    by_space_type = db.query(
        Location.space_type,
        func.count(Location.id).label('count')
    ).group_by(Location.space_type).all()

    # Por cidade
    by_city = db.query(
        Location.city,
        func.count(Location.id).label('count')
    ).group_by(Location.city).order_by(func.count(Location.id).desc()).limit(10).all()

    # Escolher um valor de preço representativo (prioriza cinema > publicidade)
    price_expr = func.coalesce(Location.price_day_cinema, Location.price_day_publicidade)
    price_ranges = db.query(
        case(
            (price_expr <= 1000, 'Até R$ 1.000'),
            (price_expr <= 5000, 'R$ 1.001 - R$ 5.000'),
            (price_expr <= 10000, 'R$ 5.001 - R$ 10.000'),
            else_='Acima de R$ 10.000'
        ).label('price_range'),
        func.count(Location.id).label('count')
    ).filter(price_expr.isnot(None)).group_by('price_range').all()

    return {
        "total_locations": total_locations,
        "by_status": {item.status: item.count for item in by_status},
        "by_space_type": {item.space_type: item.count for item in by_space_type},
        "by_city": {item.city: item.count for item in by_city},
        "price_ranges": {item.price_range: item.count for item in price_ranges}
    }

@router.get("/export/csv")
def export_locations_csv(
    status: Optional[str] = Query(None),
    space_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Exporta locações para CSV"""
    raise HTTPException(status_code=501, detail="Exportação CSV ainda não implementada")

@router.get("/export/excel")
def export_locations_excel(
    status: Optional[str] = Query(None),
    space_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Exporta locações para Excel"""
    raise HTTPException(status_code=501, detail="Exportação Excel ainda não implementada")
