from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional
from ..models.tag import Tag, TagKind, LocationTag
from ..schemas.tag import TagCreate, TagUpdate, TagResponse, TagStats
from ..models.location import Location

class TagService:
    def __init__(self, db: Session):
        self.db = db

    def get_tags(self, skip: int = 0, limit: int = 100, kind: Optional[str] = None, search: Optional[str] = None) -> List[TagResponse]:
        """Lista tags com filtros opcionais"""
        query = self.db.query(Tag)

        if kind:
            try:
                tag_kind = TagKind(kind)
                query = query.filter(Tag.kind == tag_kind)
            except ValueError:
                # Se o tipo não for válido, retorna lista vazia
                return []

        if search:
            query = query.filter(Tag.name.ilike(f"%{search}%"))

        tags = query.offset(skip).limit(limit).all()
        return [TagResponse.from_orm(tag) for tag in tags]

    def get_tag_by_id(self, tag_id: int) -> Optional[TagResponse]:
        """Obtém uma tag por ID"""
        tag = self.db.query(Tag).filter(Tag.id == tag_id).first()
        return TagResponse.from_orm(tag) if tag else None

    def create_tag(self, tag_data: TagCreate) -> TagResponse:
        """Cria uma nova tag"""
        # Verificar se já existe uma tag com o mesmo nome
        existing_tag = self.db.query(Tag).filter(Tag.name == tag_data.name).first()
        if existing_tag:
            raise ValueError(f"Já existe uma tag com o nome '{tag_data.name}'")

        tag = Tag(
            name=tag_data.name,
            kind=tag_data.kind,
            description=tag_data.description,
            color=tag_data.color
        )

        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)

        return TagResponse.from_orm(tag)

    def update_tag(self, tag_id: int, tag_data: TagUpdate) -> Optional[TagResponse]:
        """Atualiza uma tag existente"""
        tag = self.db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            return None

        # Verificar se o novo nome já existe (se estiver sendo alterado)
        if tag_data.name and tag_data.name != tag.name:
            existing_tag = self.db.query(Tag).filter(Tag.name == tag_data.name).first()
            if existing_tag:
                raise ValueError(f"Já existe uma tag com o nome '{tag_data.name}'")

        # Atualizar campos fornecidos
        update_data = tag_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tag, field, value)

        self.db.commit()
        self.db.refresh(tag)

        return TagResponse.from_orm(tag)

    def delete_tag(self, tag_id: int) -> bool:
        """Remove uma tag"""
        tag = self.db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            return False

        # Remover relacionamentos com locações primeiro
        self.db.query(LocationTag).filter(LocationTag.tag_id == tag_id).delete()

        # Remover a tag
        self.db.delete(tag)
        self.db.commit()

        return True

    def get_tags_by_kind(self, kind: str) -> List[TagResponse]:
        """Lista tags por tipo"""
        try:
            tag_kind = TagKind(kind)
            tags = self.db.query(Tag).filter(Tag.kind == tag_kind).all()
            return [TagResponse.from_orm(tag) for tag in tags]
        except ValueError:
            return []

    def search_tags_by_name(self, name: str) -> List[TagResponse]:
        """Busca tags por nome (busca parcial)"""
        tags = self.db.query(Tag).filter(Tag.name.ilike(f"%{name}%")).all()
        return [TagResponse.from_orm(tag) for tag in tags]

    def get_popular_tags(self, limit: int = 10) -> List[TagResponse]:
        """Lista as tags mais utilizadas"""
        # Contar quantas vezes cada tag é usada
        popular_tags = (
            self.db.query(Tag, func.count(LocationTag.tag_id).label('usage_count'))
            .join(LocationTag, Tag.id == LocationTag.tag_id, isouter=True)
            .group_by(Tag.id)
            .order_by(desc('usage_count'), Tag.name)
            .limit(limit)
            .all()
        )

        return [TagResponse.from_orm(tag) for tag, _ in popular_tags]

    def get_tag_stats(self) -> TagStats:
        """Obtém estatísticas das tags"""
        # Total de tags
        total_tags = self.db.query(Tag).count()

        # Tags por tipo
        tags_by_kind = (
            self.db.query(Tag.kind, func.count(Tag.id))
            .group_by(Tag.kind)
            .all()
        )
        tags_by_kind_dict = {kind.value: count for kind, count in tags_by_kind}

        # Tags mais utilizadas
        most_used = (
            self.db.query(Tag, func.count(LocationTag.tag_id).label('usage_count'))
            .join(LocationTag, Tag.id == LocationTag.tag_id, isouter=True)
            .group_by(Tag.id)
            .order_by(desc('usage_count'))
            .limit(5)
            .all()
        )
        most_used_tags = [
            {"id": tag.id, "name": tag.name, "usage_count": count}
            for tag, count in most_used
        ]

        # Tags recentes
        recent_tags = (
            self.db.query(Tag)
            .order_by(desc(Tag.created_at))
            .limit(5)
            .all()
        )
        recent_tags_response = [TagResponse.from_orm(tag) for tag in recent_tags]

        return TagStats(
            total_tags=total_tags,
            tags_by_kind=tags_by_kind_dict,
            most_used_tags=most_used_tags,
            recent_tags=recent_tags_response
        )

    def add_tag_to_location(self, location_id: int, tag_id: int) -> bool:
        """Adiciona uma tag a uma locação"""
        # Verificar se a relação já existe
        existing = (
            self.db.query(LocationTag)
            .filter(LocationTag.location_id == location_id, LocationTag.tag_id == tag_id)
            .first()
        )

        if existing:
            return False

        location_tag = LocationTag(location_id=location_id, tag_id=tag_id)
        self.db.add(location_tag)
        self.db.commit()

        return True

    def remove_tag_from_location(self, location_id: int, tag_id: int) -> bool:
        """Remove uma tag de uma locação"""
        location_tag = (
            self.db.query(LocationTag)
            .filter(LocationTag.location_id == location_id, LocationTag.tag_id == tag_id)
            .first()
        )

        if not location_tag:
            return False

        self.db.delete(location_tag)
        self.db.commit()

        return True

    def get_location_tags(self, location_id: int) -> List[TagResponse]:
        """Obtém todas as tags de uma locação"""
        tags = (
            self.db.query(Tag)
            .join(LocationTag, Tag.id == LocationTag.tag_id)
            .filter(LocationTag.location_id == location_id)
            .all()
        )

        return [TagResponse.from_orm(tag) for tag in tags]

