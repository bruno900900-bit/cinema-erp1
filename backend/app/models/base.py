from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class TimestampMixin:
    """Mixin para adicionar campos de timestamp automáticos"""
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
