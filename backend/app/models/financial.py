from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, Float, JSON, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class MovementType(str, enum.Enum):
    GASTO = "gasto"                    # Despesa com locação
    RECEITA_EXTRA = "receita_extra"    # Receita adicional
    AJUSTE = "ajuste"                  # Ajuste de orçamento
    REEMBOLSO = "reembolso"            # Reembolso de despesa

class MovementStatus(str, enum.Enum):
    PENDING = "pending"     # Pendente de aprovação
    APPROVED = "approved"   # Aprovado
    REJECTED = "rejected"   # Rejeitado
    CANCELLED = "cancelled" # Cancelado

class FinancialMovement(Base, TimestampMixin):
    __tablename__ = "financial_movements"
    __table_args__ = {'extend_existing': True}

    # Relacionamentos principais
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)  # Nullable para ajustes
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Quem criou o movimento

    # Informações do movimento
    movement_type = Column(Enum(MovementType), nullable=False)
    status = Column(Enum(MovementStatus), default=MovementStatus.PENDING)

    # Valores
    amount = Column(Float, nullable=False)  # Valor do movimento
    currency = Column(String(3), default="BRL")
    exchange_rate = Column(Float, nullable=True)  # Taxa de câmbio no momento

    # Detalhes
    description = Column(Text, nullable=False)
    reference = Column(String(255), nullable=True)  # Referência externa (nota fiscal, etc.)

    # Datas
    movement_date = Column(DateTime(timezone=True), nullable=False)  # Data efetiva do movimento
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Metadados
    tags = Column(JSON, nullable=True)  # Tags para categorização
    attachments = Column(JSON, nullable=True)  # URLs de anexos

    # Relacionamentos
    project = relationship("Project", back_populates="financial_movements")
    location = relationship("Location", back_populates="financial_movements")
    user = relationship("User", foreign_keys=[user_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<FinancialMovement(id={self.id}, type='{self.movement_type}', amount={self.amount}, status='{self.status}')>"

class BudgetAdjustment(Base, TimestampMixin):
    __tablename__ = "budget_adjustments"
    __table_args__ = {'extend_existing': True}

    # Relacionamentos
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Informações do ajuste
    adjustment_type = Column(String(50), nullable=False)  # "increase", "decrease", "reallocation"
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="BRL")

    # Motivo
    reason = Column(Text, nullable=False)
    justification = Column(Text, nullable=True)

    # Aprovação
    status = Column(Enum(MovementStatus), default=MovementStatus.PENDING)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relacionamentos
    project = relationship("Project")
    user = relationship("User", foreign_keys=[user_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<BudgetAdjustment(id={self.id}, type='{self.adjustment_type}', amount={self.amount})>"
