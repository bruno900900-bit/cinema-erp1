from sqlalchemy import Column, String, Text, JSON, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class FilterScope(str, enum.Enum):
    PRIVATE = "private"      # Apenas o usuário que criou
    TEAM = "team"           # Equipe do usuário
    PUBLIC = "public"       # Todos os usuários

class CustomFilter(Base, TimestampMixin):
    __tablename__ = "custom_filters"
    __table_args__ = {'extend_existing': True}

    # Informações básicas
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Configuração do filtro
    criteria_json = Column(JSON, nullable=False)  # Critérios do filtro
    scope = Column(Enum(FilterScope), default=FilterScope.PRIVATE)

    # Usuário proprietário
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Configurações de exibição
    is_default = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    # Cores e ícones personalizados
    color = Column(String(7), nullable=True)  # Código hex da cor
    icon = Column(String(50), nullable=True)  # Nome do ícone

    # Relacionamentos
    # Temporariamente comentado para compatibilidade
    # owner = relationship("User", back_populates="custom_filters")

    def __repr__(self):
        return f"<CustomFilter(id={self.id}, name='{self.name}', scope='{self.scope}')>"

    def get_criteria_summary(self) -> str:
        """Retorna um resumo dos critérios do filtro"""
        criteria = self.criteria_json or {}
        summary_parts = []

        if criteria.get('q'):
            summary_parts.append(f"Busca: {criteria['q']}")

        if criteria.get('city'):
            cities = criteria['city']
            if isinstance(cities, list):
                summary_parts.append(f"Cidades: {', '.join(cities)}")
            else:
                summary_parts.append(f"Cidade: {cities}")

        if criteria.get('space_type'):
            types = criteria['space_type']
            if isinstance(types, list):
                summary_parts.append(f"Tipos: {', '.join(types)}")
            else:
                summary_parts.append(f"Tipo: {types}")

        if criteria.get('price_day'):
            price = criteria['price_day']
            if isinstance(price, dict):
                min_price = price.get('min', 0)
                max_price = price.get('max', '∞')
                summary_parts.append(f"Preço: R$ {min_price} - {max_price}")

        return " | ".join(summary_parts) if summary_parts else "Filtro personalizado"
