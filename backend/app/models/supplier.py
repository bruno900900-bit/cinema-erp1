from sqlalchemy import Column, String, Text, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"
    __table_args__ = {'extend_existing': True}

    name = Column(String(255), nullable=False)
    tax_id = Column(String(20), nullable=True)  # CNPJ/CPF
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    address_json = Column(JSON, nullable=True)  # Endereço estruturado
    notes = Column(Text, nullable=True)
    rating = Column(Float, nullable=True)  # Avaliação 1-5
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    locations = relationship("Location", back_populates="supplier")
    contracts = relationship("Contract", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name='{self.name}', tax_id='{self.tax_id}')>"
