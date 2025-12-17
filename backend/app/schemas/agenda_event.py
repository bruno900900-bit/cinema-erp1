from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, date, time
from ..models.agenda_event import EventType, EventStatus

class AgendaEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título do evento")
    description: Optional[str] = Field(None, description="Descrição do evento")
    event_type: EventType = Field(..., description="Tipo do evento")
    status: EventStatus = Field(EventStatus.SCHEDULED, description="Status do evento")

    # Datas e horários
    # Datas e horários
    start_date: str = Field(..., description="Data de início (ISO string)")
    end_date: Optional[str] = Field(None, description="Data de fim (ISO string)")
    all_day: bool = Field(False, description="Evento de dia inteiro")

    # event_date: date ... (REMOVED)
    # start_time: Optional[time] ... (REMOVED)
    # end_time: Optional[time] ... (REMOVED)
    # is_all_day ... (REPLACED by all_day)

    # Relacionamentos opcionais
    project_id: Optional[int] = Field(None, description="ID do projeto")
    location_id: Optional[int] = Field(None, description="ID da locação")
    project_location_id: Optional[int] = Field(None, description="ID da locação do projeto")
    visit_id: Optional[int] = Field(None, description="ID da visita")
    contract_id: Optional[int] = Field(None, description="ID do contrato")

    # Dados adicionais
    metadata_json: Optional[Dict[str, Any]] = Field(None, description="Dados específicos do tipo de evento")
    color: Optional[str] = Field(None, description="Cor do evento no calendário (hex)")
    priority: int = Field(1, description="Prioridade do evento (1=baixa, 2=média, 3=alta)")

class AgendaEventCreate(AgendaEventBase):
    pass

class AgendaEventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    all_day: Optional[bool] = None
    # event_date: Optional[date] = None
    # start_time: Optional[time] = None
    # end_time: Optional[time] = None
    # is_all_day: Optional[bool] = None
    project_id: Optional[int] = None
    location_id: Optional[int] = None
    project_location_id: Optional[int] = None
    visit_id: Optional[int] = None
    contract_id: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    priority: Optional[int] = None

class AgendaEventResponse(AgendaEventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AgendaEventListResponse(BaseModel):
    events: list[AgendaEventResponse]
    total: int
    page: int
    size: int
    total_pages: int

class AgendaEventFilter(BaseModel):
    start_date: Optional[date] = Field(None, description="Data de início do filtro")
    end_date: Optional[date] = Field(None, description="Data de fim do filtro")
    event_type: Optional[EventType] = Field(None, description="Tipo de evento")
    status: Optional[EventStatus] = Field(None, description="Status do evento")
    project_id: Optional[int] = Field(None, description="ID do projeto")
    location_id: Optional[int] = Field(None, description="ID da locação")
    priority: Optional[int] = Field(None, description="Prioridade mínima")
