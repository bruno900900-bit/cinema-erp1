from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SENT = "sent"
    SIGNED = "signed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"
    __table_args__ = {'extend_existing': True}

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("contract_templates.id"), nullable=True)

    status = Column(Enum(ContractStatus), default=ContractStatus.DRAFT)
    version = Column(String(20), nullable=False, default="1.0")

    # URLs e arquivos
    pdf_url = Column(String(500), nullable=True)
    signed_pdf_url = Column(String(500), nullable=True)

    # Metadados
    generated_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Conteúdo personalizado
    custom_data = Column(JSON, nullable=True)  # Dados específicos do contrato
    notes = Column(Text, nullable=True)

    # Relacionamentos
    project = relationship("Project", back_populates="contracts")
    location = relationship("Location", back_populates="contracts")
    supplier = relationship("Supplier", back_populates="contracts")
    template = relationship("ContractTemplate", back_populates="contracts")

    def __repr__(self):
        return f"<Contract(id={self.id}, project_id={self.project_id}, status='{self.status}')>"

class ContractTemplate(Base, TimestampMixin):
    __tablename__ = "contract_templates"
    __table_args__ = {'extend_existing': True}

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    body_html = Column(Text, nullable=False)  # Template HTML
    locale = Column(String(10), default="pt-BR")  # Idioma
    variables_json = Column(JSON, nullable=True)  # Variáveis disponíveis
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    contracts = relationship("Contract", back_populates="template")

    def __repr__(self):
        return f"<ContractTemplate(id={self.id}, name='{self.name}', locale='{self.locale}')>"
