from typing import List, Optional, Dict, Any, Iterable
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from ..models.location import (
    Location,
    SpaceType as ModelSpaceType,
    LocationStatus as ModelLocationStatus,
    SectorType as ModelSectorType,
)
from ..models.location_photo import LocationPhoto
from ..models.tag import LocationTag
from ..schemas.location import LocationCreate, LocationUpdate, LocationResponse
import re
import unicodedata
import enum

class LocationService:
    def __init__(self, db: Session):
        self.db = db

    def _serialize_location(self, location: Location) -> Dict[str, Any]:
        """Converte uma instância de Location em dict pronto para LocationResponse.
        - Converte enums SQLAlchemy para strings
        - Inclui campos básicos e fotos quando existirem
        """
        def enum_value(v):
            return v.value if isinstance(v, enum.Enum) else v

        data: Dict[str, Any] = {
            "id": location.id,
            "title": location.title,
            "slug": location.slug,
            "summary": location.summary,
            "description": location.description,
            "status": enum_value(location.status),
            "sector_type": enum_value(location.sector_type) if hasattr(location, 'sector_type') else None,
            "supplier_id": location.supplier_id,
            "price_day_cinema": location.price_day_cinema,
            "price_hour_cinema": location.price_hour_cinema,
            "price_day_publicidade": location.price_day_publicidade,
            "price_hour_publicidade": location.price_hour_publicidade,
            "currency": location.currency,
            "street": location.street,
            "number": location.number,
            "complement": location.complement,
            "neighborhood": location.neighborhood,
            "city": location.city,
            "state": location.state,
            "country": location.country,
            "postal_code": location.postal_code,
            "supplier_name": location.supplier_name,
            "supplier_phone": location.supplier_phone,
            "supplier_email": location.supplier_email,
            "contact_person": location.contact_person,
            "contact_phone": location.contact_phone,
            "contact_email": location.contact_email,
            "space_type": enum_value(location.space_type),
            "capacity": location.capacity,
            "area_size": location.area_size,
            "power_specs": location.power_specs,
            "noise_level": location.noise_level,
            "acoustic_treatment": location.acoustic_treatment,
            "parking_spots": location.parking_spots,
            "accessibility_features": location.accessibility_features,
            "project_id": location.project_id,
            "responsible_user_id": location.responsible_user_id,
            "cover_photo_url": location.cover_photo_url,
            "created_at": location.created_at,
            "updated_at": location.updated_at,
        }

        # Fotos (se carregadas via joinedload)
        if hasattr(location, "photos") and location.photos is not None:
            import os
            base_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
            photos_list = []
            for p in location.photos:
                # Determinar URL principal
                if p.url and p.url.startswith('http'):
                    main_url = p.url
                    # Tentar construir thumbnail
                    if getattr(p, "thumbnail_path", None) and p.thumbnail_path.startswith('http'):
                        thumb_url = p.thumbnail_path
                    else:
                        try:
                            parts = p.url.rsplit('/', 1)
                            thumb_url = f"{parts[0]}/thumb_{parts[1]}" if len(parts) == 2 else p.url
                        except Exception:
                            thumb_url = p.url
                else:
                    main_url = f"{base_url}/uploads/locations/{location.id}/{p.filename}"
                    thumb_url = f"{base_url}/uploads/locations/{location.id}/thumb_{p.filename}" if getattr(p, "thumbnail_path", None) else main_url

                photos_list.append({
                    "id": p.id,
                    "filename": p.filename,
                    "original_filename": p.original_filename,
                    "url": main_url,
                    "thumbnail_url": thumb_url,
                    "caption": p.caption,
                    "is_primary": bool(p.is_primary),
                    "file_size": p.file_size,
                    "created_at": p.created_at,
                })
            data["photos"] = photos_list

        if hasattr(location, "location_tags") and location.location_tags is not None:
            tags_list = []
            for lt in location.location_tags:
                tag = getattr(lt, "tag", None)
                if not tag:
                    continue
                kind_value = tag.kind.value if isinstance(tag.kind, enum.Enum) else tag.kind
                tags_list.append(
                    {
                        "id": str(tag.id),
                        "name": tag.name,
                        "kind": kind_value,
                        "color": tag.color,
                        "description": tag.description,
                        "created_at": tag.created_at,
                        "updated_at": tag.updated_at,
                    }
                )
            data["tags"] = tags_list

        return data

    def create_location(self, location_data: LocationCreate) -> LocationResponse:
        """Cria uma nova locação"""
        # Gerar slug automaticamente se não fornecido
        # Dump to plain types to avoid mismatched Enum classes
        try:
            location_dict = location_data.model_dump(mode="json")
        except AttributeError:
            location_dict = location_data.dict()

        # Normalize enum fields to model enums
        status_val = location_dict.get("status")
        if status_val is not None:
            try:
                location_dict["status"] = ModelLocationStatus(status_val) if not isinstance(status_val, ModelLocationStatus) else status_val
            except Exception:
                location_dict["status"] = ModelLocationStatus.DRAFT

        # sector_types is now JSON array, leave as-is
        sector_types_val = location_dict.get("sector_types")
        if sector_types_val is not None:
            # Validate it's a list
            if not isinstance(sector_types_val, list):
                location_dict["sector_types"] = None
        else:
            location_dict["sector_types"] = None

        space_val = location_dict.get("space_type")
        if space_val is not None:
            try:
                location_dict["space_type"] = ModelSpaceType(space_val) if not isinstance(space_val, ModelSpaceType) else space_val
            except Exception:
                location_dict["space_type"] = None

        if 'slug' not in location_dict or not location_dict['slug']:
            location_dict['slug'] = self._generate_slug(location_dict.get('title', 'untitled'))

        location = Location(**location_dict)
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)

        # Serializar para resposta consistente (evita mismatch de enums)
        return LocationResponse.model_validate(self._serialize_location(location))

    def _generate_slug(self, title: str) -> str:
        """Gera um slug único baseado no título"""
        # Normalizar texto (remover acentos)
        normalized = unicodedata.normalize('NFD', title)
        ascii_text = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')

        # Converter para minúsculas e substituir espaços por hífens
        slug = re.sub(r'[^\w\s-]', '', ascii_text.lower())
        slug = re.sub(r'[-\s]+', '-', slug).strip('-')

        # Garantir que o slug seja único
        base_slug = slug
        counter = 1
        while self.db.query(Location).filter(Location.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    def get_location(self, location_id: int) -> Optional[LocationResponse]:
        """Obtém uma locação por ID"""
        location = self.db.query(Location).options(
            joinedload(Location.photos),
            joinedload(Location.location_tags).joinedload(LocationTag.tag)
        ).filter(Location.id == location_id).first()
        if not location:
            return None
        return LocationResponse.model_validate(self._serialize_location(location))

    def get_locations(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        space_type: Optional[str] = None,
        city: Optional[str] = None,
        project_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        sector_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[LocationResponse]:
        """Lista locações com filtros"""
        query = self.db.query(Location)

        # Map string filters to enums where applicable, ignoring invalid values
        status_enum = None
        if status:
            try:
                status_enum = ModelLocationStatus(status)
            except Exception:
                status_enum = None

        space_type_enum = None
        if space_type:
            try:
                space_type_enum = ModelSpaceType(space_type)
            except Exception:
                space_type_enum = None

        sector_type_enum = None
        if sector_type:
            try:
                sector_type_enum = ModelSectorType(sector_type)
            except Exception:
                sector_type_enum = None

        if status_enum is not None:
            query = query.filter(Location.status == status_enum)

        if space_type_enum is not None:
            query = query.filter(Location.space_type == space_type_enum)

        if sector_type_enum is not None:
            query = query.filter(Location.sector_type == sector_type_enum)


        if city:
            query = query.filter(Location.city == city)

        if project_id:
            query = query.filter(Location.project_id == project_id)

        if supplier_id:
            query = query.filter(Location.supplier_id == supplier_id)

        if search:
            query = query.filter(
                or_(
                    Location.title.ilike(f"%{search}%"),
                    Location.description.ilike(f"%{search}%"),
                    Location.city.ilike(f"%{search}%"),
                    Location.neighborhood.ilike(f"%{search}%")
                )
            )

        locations = (
            query.options(
                joinedload(Location.photos),
                joinedload(Location.location_tags).joinedload(LocationTag.tag),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [LocationResponse.model_validate(self._serialize_location(loc)) for loc in locations]

    def update_location(self, location_id: int, location_data: LocationUpdate) -> Optional[LocationResponse]:
        """Atualiza uma locação"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
            return None

        update_data = location_data.dict(exclude_unset=True)

        tag_ids_raw = None
        if "tag_ids" in update_data:
            tag_ids_raw = update_data.pop("tag_ids")
        elif "tags" in update_data:
            tag_ids_raw = update_data.pop("tags")

        for field, value in update_data.items():
            setattr(location, field, value)

        if tag_ids_raw is not None:
            self._set_location_tags(location, tag_ids_raw)

        self.db.commit()

        # Retornar locação atualizada com relacionamentos carregados
        updated = self.get_location(location_id)
        return updated

    def _set_location_tags(self, location: Location, tags: Iterable[Any]) -> None:
        """Atualiza as associações de tags para a locação."""
        if tags is None:
            return

        normalized_ids: List[int] = []
        for raw in tags:
            tag_id = raw
            if isinstance(raw, dict):
                tag_id = raw.get("id")
            try:
                if tag_id is None:
                    continue
                normalized_ids.append(int(tag_id))
            except (TypeError, ValueError):
                continue

        new_ids = set(normalized_ids)
        existing = {lt.tag_id: lt for lt in location.location_tags}

        # Remover associações obsoletas
        for tag_id, link in existing.items():
            if tag_id not in new_ids:
                self.db.delete(link)

        # Adicionar novas associações
        for tag_id in new_ids:
            if tag_id not in existing:
                self.db.add(LocationTag(location_id=location.id, tag_id=tag_id))


    def delete_location(self, location_id: int) -> bool:
        """Remove uma locação"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
            return False

        self.db.delete(location)
        self.db.commit()
        return True
