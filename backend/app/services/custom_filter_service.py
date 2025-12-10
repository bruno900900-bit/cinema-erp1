from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from ..models.custom_filter import CustomFilter, FilterScope
from ..schemas.custom_filter import CustomFilterCreate, CustomFilterUpdate, FilterCriteria
from ..models.user import User
import json

class CustomFilterService:
    def __init__(self, db: Session):
        self.db = db

    def create_filter(self, filter_data: CustomFilterCreate, user_id: int) -> CustomFilter:
        """Cria um novo filtro personalizado"""
        # Validar critérios
        self._validate_criteria(filter_data.criteria_json)

        # Se é o filtro padrão, remover padrão dos outros filtros do usuário
        if filter_data.is_default:
            self._remove_default_from_user_filters(user_id)

        db_filter = CustomFilter(
            name=filter_data.name,
            description=filter_data.description,
            criteria_json=filter_data.criteria_json,
            scope=filter_data.scope,
            color=filter_data.color,
            icon=filter_data.icon,
            is_default=filter_data.is_default,
            sort_order=filter_data.sort_order,
            owner_user_id=user_id
        )

        self.db.add(db_filter)
        self.db.commit()
        self.db.refresh(db_filter)

        return db_filter

    def get_filters_by_user(self, user_id: int, include_public: bool = True) -> List[CustomFilter]:
        """Busca filtros do usuário"""
        query = self.db.query(CustomFilter).filter(
            and_(
                CustomFilter.is_active == True,
                or_(
                    CustomFilter.owner_user_id == user_id,
                    and_(
                        include_public,
                        CustomFilter.scope == FilterScope.PUBLIC
                    )
                )
            )
        ).order_by(CustomFilter.sort_order, CustomFilter.name)

        return query.all()

    def get_filter_by_id(self, filter_id: int, user_id: int) -> Optional[CustomFilter]:
        """Busca um filtro específico"""
        return self.db.query(CustomFilter).filter(
            and_(
                CustomFilter.id == filter_id,
                or_(
                    CustomFilter.owner_user_id == user_id,
                    CustomFilter.scope == FilterScope.PUBLIC
                ),
                CustomFilter.is_active == True
            )
        ).first()

    def update_filter(self, filter_id: int, filter_data: CustomFilterUpdate, user_id: int) -> Optional[CustomFilter]:
        """Atualiza um filtro personalizado"""
        db_filter = self.get_filter_by_id(filter_id, user_id)
        if not db_filter:
            return None

        # Verificar se o usuário é o proprietário
        if db_filter.owner_user_id != user_id:
            return None

        # Validar critérios se fornecidos
        if filter_data.criteria_json:
            self._validate_criteria(filter_data.criteria_json)

        # Se está marcando como padrão, remover padrão dos outros
        if filter_data.is_default:
            self._remove_default_from_user_filters(user_id)

        # Atualizar campos
        update_data = filter_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_filter, field, value)

        self.db.commit()
        self.db.refresh(db_filter)

        return db_filter

    def delete_filter(self, filter_id: int, user_id: int) -> bool:
        """Remove um filtro personalizado (soft delete)"""
        db_filter = self.get_filter_by_id(filter_id, user_id)
        if not db_filter:
            return False

        # Verificar se o usuário é o proprietário
        if db_filter.owner_user_id != user_id:
            return False

        db_filter.is_active = False
        self.db.commit()

        return True

    def duplicate_filter(self, filter_id: int, user_id: int, new_name: str) -> Optional[CustomFilter]:
        """Duplica um filtro existente"""
        original_filter = self.get_filter_by_id(filter_id, user_id)
        if not original_filter:
            return None

        new_filter = CustomFilter(
            name=new_name,
            description=original_filter.description,
            criteria_json=original_filter.criteria_json,
            scope=FilterScope.PRIVATE,  # Duplicatas sempre privadas
            color=original_filter.color,
            icon=original_filter.icon,
            is_default=False,
            sort_order=original_filter.sort_order,
            owner_user_id=user_id
        )

        self.db.add(new_filter)
        self.db.commit()
        self.db.refresh(new_filter)

        return new_filter

    def get_default_filter(self, user_id: int) -> Optional[CustomFilter]:
        """Busca o filtro padrão do usuário"""
        return self.db.query(CustomFilter).filter(
            and_(
                CustomFilter.owner_user_id == user_id,
                CustomFilter.is_default == True,
                CustomFilter.is_active == True
            )
        ).first()

    def set_default_filter(self, filter_id: int, user_id: int) -> bool:
        """Define um filtro como padrão"""
        db_filter = self.get_filter_by_id(filter_id, user_id)
        if not db_filter or db_filter.owner_user_id != user_id:
            return False

        # Remover padrão dos outros filtros
        self._remove_default_from_user_filters(user_id)

        # Definir este como padrão
        db_filter.is_default = True
        self.db.commit()

        return True

    def _validate_criteria(self, criteria: Dict[str, Any]) -> None:
        """Valida os critérios do filtro"""
        # Validar estrutura básica
        if not isinstance(criteria, dict):
            raise ValueError("Critérios devem ser um objeto JSON")

        # Validar tipos de dados
        valid_fields = {
            'q': str,
            'city': list,
            'state': list,
            'space_type': list,
            'status': list,
            'price_day': dict,
            'price_hour': dict,
            'capacity': dict,
            'area_size': dict,
            'tags': list,
            'supplier_ids': list,
            'project_ids': list,
            'responsible_user_ids': list,
            'created_after': str,
            'created_before': str,
            'geo_radius': dict
        }

        for field, value in criteria.items():
            if field not in valid_fields:
                raise ValueError(f"Campo '{field}' não é válido")

            expected_type = valid_fields[field]
            if not isinstance(value, expected_type):
                raise ValueError(f"Campo '{field}' deve ser do tipo {expected_type.__name__}")

        # Validar faixas de preço
        for price_field in ['price_day', 'price_hour']:
            if price_field in criteria:
                price_range = criteria[price_field]
                if 'min' in price_range and 'max' in price_range:
                    if price_range['min'] > price_range['max']:
                        raise ValueError(f"Preço mínimo não pode ser maior que o máximo em {price_field}")

    def _remove_default_from_user_filters(self, user_id: int) -> None:
        """Remove o status de padrão de todos os filtros do usuário"""
        self.db.query(CustomFilter).filter(
            and_(
                CustomFilter.owner_user_id == user_id,
                CustomFilter.is_default == True
            )
        ).update({"is_default": False})
        self.db.commit()

    def get_filter_summary(self, filter_id: int, user_id: int) -> Optional[str]:
        """Retorna um resumo dos critérios do filtro"""
        db_filter = self.get_filter_by_id(filter_id, user_id)
        if not db_filter:
            return None

        return db_filter.get_criteria_summary()

    def search_filters(self, query: str, user_id: int) -> List[CustomFilter]:
        """Busca filtros por nome ou descrição"""
        search_term = f"%{query}%"
        return self.db.query(CustomFilter).filter(
            and_(
                or_(
                    CustomFilter.owner_user_id == user_id,
                    CustomFilter.scope == FilterScope.PUBLIC
                ),
                or_(
                    CustomFilter.name.ilike(search_term),
                    CustomFilter.description.ilike(search_term)
                ),
                CustomFilter.is_active == True
            )
        ).order_by(CustomFilter.name).all()

