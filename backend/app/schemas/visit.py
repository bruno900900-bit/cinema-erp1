from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from ..models.visit import VisitEtapa, VisitStatus

# Schemas para VisitParticipant
class VisitParticipantBase(BaseModel):
    user_id: int
    role: str

class VisitParticipantCreate(VisitParticipantBase):
    pass

class VisitParticipantUpdate(BaseModel):
    role: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

class VisitParticipantResponse(VisitParticipantBase):
    id: int
    visit_id: int
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para Visit
class VisitBase(BaseModel):
    title: str
    description: Optional[str] = None
    etapa: VisitEtapa
    start_datetime: datetime
    end_datetime: datetime
    project_id: int
    location_id: int

class VisitCreate(VisitBase):
    participants: List[VisitParticipantCreate]
    
    @validator('end_datetime')
    def end_datetime_must_be_after_start(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('end_datetime must be after start_datetime')
        return v

class VisitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    etapa: Optional[VisitEtapa] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    status: Optional[VisitStatus] = None
    
    @validator('end_datetime')
    def end_datetime_must_be_after_start(cls, v, values):
        if 'start_datetime' in values and v and values['start_datetime'] and v <= values['start_datetime']:
            raise ValueError('end_datetime must be after start_datetime')
        return v

class VisitResponse(VisitBase):
    id: int
    status: VisitStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    participants: List[VisitParticipantResponse]
    
    class Config:
        from_attributes = True

# Schema para filtros de visita
class VisitFilter(BaseModel):
    date_range: Optional[dict] = None  # {"from": "2025-01-01", "to": "2025-01-31"}
    project_ids: Optional[List[int]] = None
    location_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None
    etapas: Optional[List[VisitEtapa]] = None
    status: Optional[List[VisitStatus]] = None
    
    @validator('date_range')
    def validate_date_range(cls, v):
        if v:
            if not isinstance(v, dict) or 'from' not in v or 'to' not in v:
                raise ValueError('date_range must have "from" and "to" keys')
            try:
                datetime.strptime(v['from'], '%Y-%m-%d')
                datetime.strptime(v['to'], '%Y-%m-%d')
            except ValueError:
                raise ValueError('date_range dates must be in YYYY-MM-DD format')
        return v
