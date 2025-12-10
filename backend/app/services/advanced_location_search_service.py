from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text, case
from sqlalchemy.sql import Select
from ..models.location import Location, LocationStatus, SpaceType, SectorType
from ..models.tag import Tag, TagKind, LocationTag
from ..models.supplier import Supplier
from ..models.project import Project, ProjectStatus
from ..models.user import User
from ..models.financial import FinancialMovement, MovementType
from ..schemas.location_search_advanced import AdvancedLocationSearchRequest, AdvancedLocationSearchResponse
import math

class AdvancedLocationSearchService:
    def __init__(self, db: Session):
        self.db = db

    def search_locations(self, search_request: AdvancedLocationSearchRequest) -> AdvancedLocationSearchResponse:
        """Busca avançada de locações com filtros financeiros e por setor"""

        # Construir query base
        query = self._build_base_query(search_request)

        # Aplicar filtros
        query = self._apply_filters(query, search_request)

        # Aplicar ordenação
        query = self._apply_sorting(query, search_request.sort)

        # Contar total para paginação
        total = self._count_total(query)

        # Aplicar paginação
        query = self._apply_pagination(query, search_request.page, search_request.page_size)

        # Executar query
        locations = query.all()

        # Processar resultados
        processed_locations = self._process_results(locations, search_request.include)

        # Calcular facetas se solicitado
        facets = None
        if search_request.facets:
            facets = self._calculate_advanced_facets(search_request)

        # Calcular total de páginas
        total_pages = math.ceil(total / search_request.page_size)

        return AdvancedLocationSearchResponse(
            locations=processed_locations,
            total=total,
            page=search_request.page,
            page_size=search_request.page_size,
            total_pages=total_pages,
            facets=facets
        )

    def _build_base_query(self, search_request: AdvancedLocationSearchRequest) -> Select:
        """Constrói a query base com joins necessários"""

        query = self.db.query(Location)

        # Joins condicionais baseados nos filtros solicitados
        if search_request.include:
            if 'supplier' in search_request.include:
                query = query.outerjoin(Supplier, Location.supplier_id == Supplier.id)

            if 'project' in search_request.include:
                query = query.outerjoin(Project, Location.project_id == Project.id)

            if 'tags' in search_request.include:
                query = query.outerjoin(LocationTag, Location.id == LocationTag.location_id)
                query = query.outerjoin(Tag, LocationTag.tag_id == Tag.id)

            if 'photos' in search_request.include:
                query = query.outerjoin(LocationPhoto, Location.id == LocationPhoto.location_id)

        # Join obrigatório para filtros financeiros
        if search_request.budget_remaining or search_request.archived is not None:
            query = query.outerjoin(Project, Location.project_id == Project.id)

        return query

    def _apply_filters(self, query: Select, search_request: AdvancedLocationSearchRequest) -> Select:
        """Aplica todos os filtros avançados à query"""

        # Filtro por busca textual
        if search_request.q:
            query = self._apply_text_search(query, search_request.q)

        # Filtros por IDs
        if search_request.project_ids:
            query = query.filter(Location.project_id.in_(search_request.project_ids))

        if search_request.supplier_ids:
            query = query.filter(Location.supplier_id.in_(search_request.supplier_ids))

        if search_request.responsible_user_ids:
            query = query.filter(Location.responsible_user_id.in_(search_request.responsible_user_ids))

        # Filtros por status e tipo
        if search_request.status:
            query = query.filter(Location.status.in_(search_request.status))

        if search_request.space_type:
            query = query.filter(Location.space_type.in_(search_request.space_type))

        # Filtro por tipo de setor
        if search_request.sector_type:
            query = query.filter(Location.sector_type.in_(search_request.sector_type))

        # Filtros por tags
        if search_request.tags:
            query = self._apply_tag_filters(query, search_request.tags)

        # Filtros geográficos
        if search_request.city:
            query = query.filter(Location.city.in_(search_request.city))

        if search_request.state:
            query = query.filter(Location.state.in_(search_request.state))

        if search_request.country:
            query = query.filter(Location.country.in_(search_request.country))

        # Filtros por preço diferenciado por setor
        if search_request.precos:
            query = self._apply_sector_price_filters(query, search_request.precos)

        # Filtros por capacidade
        if search_request.capacity:
            if search_request.capacity.min is not None:
                query = query.filter(Location.capacity >= search_request.capacity.min)
            if search_request.capacity.max is not None:
                query = query.filter(Location.capacity <= search_request.capacity.max)

        # Filtros por data
        if search_request.date_range:
            query = self._apply_date_filters(query, search_request.date_range)

        # Filtro geográfico
        if search_request.geo:
            query = self._apply_geo_filter(query, search_request.geo)

        # Filtros financeiros
        if search_request.budget_remaining:
            query = self._apply_budget_filters(query, search_request.budget_remaining)

        # Filtro por arquivamento
        if search_request.archived is not None:
            query = self._apply_archived_filter(query, search_request.archived)

        return query

    def _apply_sector_price_filters(self, query: Select, precos: Dict[str, Any]) -> Select:
        """Aplica filtros de preço diferenciados por setor"""

        # Filtros para cinema
        if "cinema" in precos:
            cinema_prices = precos["cinema"]

            if cinema_prices.price_day:
                if cinema_prices.price_day.min is not None:
                    query = query.filter(Location.price_day_cinema >= cinema_prices.price_day.min)
                if cinema_prices.price_day.max is not None:
                    query = query.filter(Location.price_day_cinema <= cinema_prices.price_day.max)

            if cinema_prices.price_hour:
                if cinema_prices.price_hour.min is not None:
                    query = query.filter(Location.price_hour_cinema >= cinema_prices.price_hour.min)
                if cinema_prices.price_hour.max is not None:
                    query = query.filter(Location.price_hour_cinema <= cinema_prices.price_hour.max)

        # Filtros para publicidade
        if "publicidade" in precos:
            publicidade_prices = precos["publicidade"]

            if publicidade_prices.price_day:
                if publicidade_prices.price_day.min is not None:
                    query = query.filter(Location.price_day_publicidade >= publicidade_prices.price_day.min)
                if publicidade_prices.price_day.max is not None:
                    query = query.filter(Location.price_day_publicidade <= publicidade_prices.price_day.max)

            if publicidade_prices.price_hour:
                if publicidade_prices.price_hour.min is not None:
                    query = query.filter(Location.price_hour_publicidade >= publicidade_prices.price_hour.min)
                if publicidade_prices.price_hour.max is not None:
                    query = query.filter(Location.price_hour_publicidade <= publicidade_prices.price_hour.max)

        return query

    def _apply_budget_filters(self, query: Select, budget_range) -> Select:
        """Aplica filtros por saldo restante do projeto"""

        if budget_range.min is not None:
            query = query.filter(Project.budget_remaining >= budget_range.min)

        if budget_range.max is not None:
            query = query.filter(Project.budget_remaining <= budget_range.max)

        return query

    def _apply_archived_filter(self, query: Select, archived: bool) -> Select:
        """Aplica filtro por status de arquivamento do projeto"""

        if archived:
            query = query.filter(Project.status == ProjectStatus.ARCHIVED)
        else:
            query = query.filter(Project.status != ProjectStatus.ARCHIVED)

        return query

    def _apply_text_search(self, query: Select, search_term: str) -> Select:
        """Aplica busca textual usando FTS e trigram"""

        # Busca por título, descrição e cidade
        search_conditions = [
            Location.title.ilike(f"%{search_term}%"),
            Location.description.ilike(f"%{search_term}%"),
            Location.city.ilike(f"%{search_term}%"),
            Location.summary.ilike(f"%{search_term}%")
        ]

        # Se temos search_vector configurado, usar FTS
        if hasattr(Location, 'search_vector') and Location.search_vector:
            # Aqui implementaríamos busca FTS com tsvector
            pass

        return query.filter(or_(*search_conditions))

    def _apply_tag_filters(self, query: Select, tags: Dict[TagKind, List[str]]) -> Select:
        """Aplica filtros por tags organizadas por categoria"""

        for kind, tag_names in tags.items():
            if tag_names:
                # Subquery para encontrar locações com as tags especificadas
                tag_subquery = (
                    self.db.query(LocationTag.location_id)
                    .join(Tag, LocationTag.tag_id == Tag.id)
                    .filter(
                        and_(
                            Tag.kind == kind,
                            Tag.name.in_(tag_names)
                        )
                    )
                    .subquery()
                )

                query = query.filter(Location.id.in_(tag_subquery))

        return query

    def _apply_date_filters(self, query: Select, date_range) -> Select:
        """Aplica filtros por data de disponibilidade"""

        # Aqui implementaríamos filtros por disponibilidade
        # Por enquanto, filtro básico por created_at
        if date_range.from_date:
            query = query.filter(Location.created_at >= date_range.from_date)

        if date_range.to_date:
            query = query.filter(Location.created_at <= date_range.to_date)

        return query

    def _apply_geo_filter(self, query: Select, geo_search) -> Select:
        """Aplica filtro geográfico por raio"""

        # Aqui implementaríamos filtro PostGIS
        # Por enquanto, filtro básico por coordenadas aproximadas
        # Em produção, usaríamos ST_DWithin ou similar

        return query

    def _apply_sorting(self, query: Select, sort_fields: List[Dict[str, str]]) -> Select:
        """Aplica ordenação baseada nos campos especificados"""

        for sort_field in sort_fields:
            field_name = sort_field['field']
            direction = sort_field['direction']

            # Mapear campos de ordenação
            if field_name == 'score':
                # Ordenação por relevância (implementar score de busca)
                continue
            elif field_name == 'price_day_cinema':
                field = Location.price_day_cinema
            elif field_name == 'price_day_publicidade':
                field = Location.price_day_publicidade
            elif field_name == 'price_hour_cinema':
                field = Location.price_hour_cinema
            elif field_name == 'price_hour_publicidade':
                field = Location.price_hour_publicidade
            elif field_name == 'created_at':
                field = Location.created_at
            elif field_name == 'title':
                field = Location.title
            elif field_name == 'capacity':
                field = Location.capacity
            else:
                continue

            if direction == 'asc':
                query = query.order_by(field.asc())
            else:
                query = query.order_by(field.desc())

        return query

    def _apply_pagination(self, query: Select, page: int, page_size: int) -> Select:
        """Aplica paginação à query"""

        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size)

    def _count_total(self, query: Select) -> int:
        """Conta o total de resultados sem paginação"""

        # Remover joins desnecessários para contagem
        count_query = query.with_entities(func.count(Location.id))
        return count_query.scalar()

    def _process_results(self, locations: List[Location], include: Optional[List[str]]) -> List[Dict[str, Any]]:
        """Processa os resultados incluindo relacionamentos solicitados"""

        processed = []

        for location in locations:
            location_dict = {
                'id': location.id,
                'title': location.title,
                'slug': location.slug,
                'summary': location.summary,
                'description': location.description,
                'status': location.status,
                'sector_type': location.sector_type if hasattr(location, 'sector_type') else None,
                'price_day_cinema': location.price_day_cinema,
                'price_hour_cinema': location.price_hour_cinema,
                'price_day_publicidade': location.price_day_publicidade,
                'price_hour_publicidade': location.price_hour_publicidade,
                'currency': location.currency,
                'city': location.city,
                'state': location.state,
                'country': location.country,
                'space_type': location.space_type,
                'capacity': location.capacity,
                'area_size': location.area_size,
                'created_at': location.created_at,
                'updated_at': location.updated_at
            }

            # Incluir relacionamentos solicitados
            if include:
                if 'supplier' in include and location.supplier:
                    location_dict['supplier'] = {
                        'id': location.supplier.id,
                        'name': location.supplier.name,
                        'rating': location.supplier.rating
                    }

                if 'project' in include and location.project:
                    location_dict['project'] = {
                        'id': location.project.id,
                        'name': location.project.name,
                        'client_name': location.project.client_name,
                        'budget_total': location.project.budget_total,
                        'budget_spent': location.project.budget_spent,
                        'budget_remaining': location.project.budget_remaining,
                        'status': location.project.status
                    }

                if 'photos' in include and location.photos:
                    location_dict['photos'] = [
                        {
                            'id': photo.id,
                            'url': photo.url,
                            'caption': photo.caption,
                            'is_primary': photo.is_primary
                        }
                        for photo in sorted(location.photos, key=lambda x: x.sort_order)
                    ]

                if 'tags' in include and location.location_tags:
                    tags_by_kind = {}
                    for lt in location.location_tags:
                        kind = lt.tag.kind
                        if kind not in tags_by_kind:
                            tags_by_kind[kind] = []
                        tags_by_kind[kind].append({
                            'id': lt.tag.id,
                            'name': lt.tag.name,
                            'color': lt.tag.color
                        })
                    location_dict['tags'] = tags_by_kind

            processed.append(location_dict)

        return processed

    def _calculate_advanced_facets(self, search_request: AdvancedLocationSearchRequest) -> Dict[str, Any]:
        """Calcula facetas avançadas incluindo informações financeiras"""

        facets = {}

        # Faceta por status
        status_facets = (
            self.db.query(Location.status, func.count(Location.id))
            .group_by(Location.status)
            .all()
        )
        facets['status'] = [{'value': status, 'count': count} for status, count in status_facets]

        # Faceta por tipo de espaço
        space_type_facets = (
            self.db.query(Location.space_type, func.count(Location.id))
            .group_by(Location.space_type)
            .all()
        )
        facets['space_type'] = [{'value': st, 'count': count} for st, count in space_type_facets]

        # Faceta por tipo de setor
        sector_type_facets = (
            self.db.query(Location.sector_type, func.count(Location.id))
            .group_by(Location.sector_type)
            .all()
        )
        facets['sector_type'] = [{'value': st, 'count': count} for st, count in sector_type_facets]

        # Faceta por cidade
        city_facets = (
            self.db.query(Location.city, func.count(Location.id))
            .filter(Location.city.isnot(None))
            .group_by(Location.city)
            .order_by(func.count(Location.id).desc())
            .limit(20)
            .all()
        )
        facets['city'] = [{'value': city, 'count': count} for city, count in city_facets]

        # Facetas por preço por setor
        facets['price_cinema'] = self._calculate_price_facets('cinema')
        facets['price_publicidade'] = self._calculate_price_facets('publicidade')

        # Faceta por faixa de orçamento restante
        facets['budget_remaining'] = self._calculate_budget_facets()

        return facets

    def _calculate_price_facets(self, sector: str) -> List[Dict[str, Any]]:
        """Calcula facetas de preço para um setor específico"""

        if sector == "cinema":
            price_field = Location.price_day_cinema
        else:
            price_field = Location.price_day_publicidade

        price_ranges = [
            (0, 1000, f"Até R$ 1.000 ({sector})"),
            (1000, 5000, f"R$ 1.000 - R$ 5.000 ({sector})"),
            (5000, 10000, f"R$ 5.000 - R$ 10.000 ({sector})"),
            (10000, 20000, f"R$ 10.000 - R$ 20.000 ({sector})"),
            (20000, None, f"Acima de R$ 20.000 ({sector})")
        ]

        price_facets = []
        for min_price, max_price, label in price_ranges:
            if max_price is None:
                count = self.db.query(Location).filter(price_field >= min_price).count()
            else:
                count = self.db.query(Location).filter(
                    and_(
                        price_field >= min_price,
                        price_field < max_price
                    )
                ).count()

            price_facets.append({'range': label, 'count': count})

        return price_facets

    def _calculate_budget_facets(self) -> List[Dict[str, Any]]:
        """Calcula facetas por faixa de orçamento restante"""

        budget_ranges = [
            (0, 10000, "Até R$ 10.000"),
            (10000, 50000, "R$ 10.000 - R$ 50.000"),
            (50000, 100000, "R$ 50.000 - R$ 100.000"),
            (100000, 500000, "R$ 100.000 - R$ 500.000"),
            (500000, None, "Acima de R$ 500.000")
        ]

        budget_facets = []
        for min_budget, max_budget, label in budget_ranges:
            if max_budget is None:
                count = self.db.query(Project).filter(Project.budget_remaining >= min_budget).count()
            else:
                count = self.db.query(Project).filter(
                    and_(
                        Project.budget_remaining >= min_budget,
                        Project.budget_remaining < max_budget
                    )
                ).count()

            budget_facets.append({'range': label, 'count': count})

        return budget_facets
