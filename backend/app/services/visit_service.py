from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date
from ..models.visit import Visit, VisitParticipant, VisitStatus, VisitEtapa
from ..models.project import Project
from ..models.location import Location
from ..models.user import User
from ..schemas.visit import VisitCreate, VisitUpdate, VisitFilter, VisitParticipantCreate, VisitParticipantUpdate
from ..schemas.visit import VisitResponse, VisitParticipantResponse

class VisitService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_visit(self, visit_data: VisitCreate, created_by_user_id: int) -> VisitResponse:
        """Cria uma nova visita com participantes"""
        # Verificar se projeto e locação existem
        project = self.db.query(Project).filter(Project.id == visit_data.project_id).first()
        if not project:
            raise ValueError(f"Project with id {visit_data.project_id} not found")
        
        location = self.db.query(Location).filter(Location.id == visit_data.location_id).first()
        if not location:
            raise ValueError(f"Location with id {visit_data.location_id} not found")
        
        # Criar a visita
        visit = Visit(
            title=visit_data.title,
            description=visit_data.description,
            etapa=visit_data.etapa,
            start_datetime=visit_data.start_datetime,
            end_datetime=visit_data.end_datetime,
            project_id=visit_data.project_id,
            location_id=visit_data.location_id,
            created_by=created_by_user_id,
            status=VisitStatus.SCHEDULED
        )
        
        self.db.add(visit)
        self.db.flush()  # Para obter o ID da visita
        
        # Adicionar participantes
        for participant_data in visit_data.participants:
            # Verificar se usuário existe
            user = self.db.query(User).filter(User.id == participant_data.user_id).first()
            if not user:
                raise ValueError(f"User with id {participant_data.user_id} not found")
            
            participant = VisitParticipant(
                visit_id=visit.id,
                user_id=participant_data.user_id,
                role=participant_data.role
            )
            self.db.add(participant)
        
        self.db.commit()
        self.db.refresh(visit)
        
        return self._visit_to_response(visit)
    
    def get_visit(self, visit_id: int) -> Optional[VisitResponse]:
        """Obtém uma visita específica por ID"""
        visit = self.db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return None
        return self._visit_to_response(visit)
    
    def get_visits(self, filters: Optional[VisitFilter] = None, skip: int = 0, limit: int = 100) -> List[VisitResponse]:
        """Lista visitas com filtros avançados"""
        query = self.db.query(Visit)
        
        if filters:
            # Filtro por intervalo de datas
            if filters.date_range:
                from_date = datetime.strptime(filters.date_range['from'], '%Y-%m-%d').date()
                to_date = datetime.strptime(filters.date_range['to'], '%Y-%m-%d').date()
                query = query.filter(
                    and_(
                        func.date(Visit.start_datetime) >= from_date,
                        func.date(Visit.start_datetime) <= to_date
                    )
                )
            
            # Filtro por projetos
            if filters.project_ids:
                query = query.filter(Visit.project_id.in_(filters.project_ids))
            
            # Filtro por locações
            if filters.location_ids:
                query = query.filter(Visit.location_id.in_(filters.location_ids))
            
            # Filtro por usuários (participantes)
            if filters.user_ids:
                query = query.join(VisitParticipant).filter(VisitParticipant.user_id.in_(filters.user_ids))
            
            # Filtro por etapas
            if filters.etapas:
                query = query.filter(Visit.etapa.in_(filters.etapas))
            
            # Filtro por status
            if filters.status:
                query = query.filter(Visit.status.in_(filters.status))
        
        visits = query.offset(skip).limit(limit).all()
        return [self._visit_to_response(visit) for visit in visits]
    
    def update_visit(self, visit_id: int, visit_data: VisitUpdate) -> Optional[VisitResponse]:
        """Atualiza uma visita existente"""
        visit = self.db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return None
        
        # Atualizar campos
        update_data = visit_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(visit, field, value)
        
        self.db.commit()
        self.db.refresh(visit)
        
        return self._visit_to_response(visit)
    
    def cancel_visit(self, visit_id: int) -> Optional[VisitResponse]:
        """Cancela uma visita (muda status para cancelled)"""
        visit = self.db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return None
        
        visit.status = VisitStatus.CANCELLED
        self.db.commit()
        self.db.refresh(visit)
        
        return self._visit_to_response(visit)
    
    def complete_visit(self, visit_id: int) -> Optional[VisitResponse]:
        """Marca uma visita como concluída"""
        visit = self.db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return None
        
        visit.status = VisitStatus.COMPLETED
        self.db.commit()
        self.db.refresh(visit)
        
        return self._visit_to_response(visit)
    
    def delete_visit(self, visit_id: int) -> bool:
        """Remove uma visita (soft delete - apenas muda status para cancelled)"""
        visit = self.db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return False
        
        visit.status = VisitStatus.CANCELLED
        self.db.commit()
        return True
    
    # Métodos para participantes
    def add_participant(self, visit_id: int, participant_data: VisitParticipantCreate) -> Optional[VisitParticipantResponse]:
        """Adiciona um participante a uma visita"""
        visit = self.db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return None
        
        # Verificar se usuário existe
        user = self.db.query(User).filter(User.id == participant_data.user_id).first()
        if not user:
            raise ValueError(f"User with id {participant_data.user_id} not found")
        
        # Verificar se já é participante
        existing = self.db.query(VisitParticipant).filter(
            and_(
                VisitParticipant.visit_id == visit_id,
                VisitParticipant.user_id == participant_data.user_id
            )
        ).first()
        
        if existing:
            raise ValueError(f"User {participant_data.user_id} is already a participant of this visit")
        
        participant = VisitParticipant(
            visit_id=visit_id,
            user_id=participant_data.user_id,
            role=participant_data.role
        )
        
        self.db.add(participant)
        self.db.commit()
        self.db.refresh(participant)
        
        return self._participant_to_response(participant)
    
    def update_participant(self, visit_id: int, user_id: int, participant_data: VisitParticipantUpdate) -> Optional[VisitParticipantResponse]:
        """Atualiza dados de um participante"""
        participant = self.db.query(VisitParticipant).filter(
            and_(
                VisitParticipant.visit_id == visit_id,
                VisitParticipant.user_id == user_id
            )
        ).first()
        
        if not participant:
            return None
        
        # Atualizar campos
        update_data = participant_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(participant, field, value)
        
        self.db.commit()
        self.db.refresh(participant)
        
        return self._participant_to_response(participant)
    
    def remove_participant(self, visit_id: int, user_id: int) -> bool:
        """Remove um participante de uma visita"""
        participant = self.db.query(VisitParticipant).filter(
            and_(
                VisitParticipant.visit_id == visit_id,
                VisitParticipant.user_id == user_id
            )
        ).first()
        
        if not participant:
            return False
        
        self.db.delete(participant)
        self.db.commit()
        return True
    
    def check_in_participant(self, visit_id: int, user_id: int) -> Optional[VisitParticipantResponse]:
        """Registra check-in de um participante"""
        participant = self.db.query(VisitParticipant).filter(
            and_(
                VisitParticipant.visit_id == visit_id,
                VisitParticipant.user_id == user_id
            )
        ).first()
        
        if not participant:
            return None
        
        participant.check_in_time = datetime.utcnow()
        self.db.commit()
        self.db.refresh(participant)
        
        return self._participant_to_response(participant)
    
    def check_out_participant(self, visit_id: int, user_id: int) -> Optional[VisitParticipantResponse]:
        """Registra check-out de um participante"""
        participant = self.db.query(VisitParticipant).filter(
            and_(
                VisitParticipant.visit_id == visit_id,
                VisitParticipant.user_id == user_id
            )
        ).first()
        
        if not participant:
            return None
        
        participant.check_out_time = datetime.utcnow()
        self.db.commit()
        self.db.refresh(participant)
        
        return self._participant_to_response(participant)
    
    # Métodos auxiliares
    def _visit_to_response(self, visit: Visit) -> VisitResponse:
        """Converte modelo Visit para VisitResponse"""
        return VisitResponse(
            id=visit.id,
            title=visit.title,
            description=visit.description,
            etapa=visit.etapa,
            start_datetime=visit.start_datetime,
            end_datetime=visit.end_datetime,
            project_id=visit.project_id,
            location_id=visit.location_id,
            status=visit.status,
            created_by=visit.created_by,
            created_at=visit.created_at,
            updated_at=visit.updated_at,
            participants=[self._participant_to_response(p) for p in visit.participants]
        )
    
    def _participant_to_response(self, participant: VisitParticipant) -> VisitParticipantResponse:
        """Converte modelo VisitParticipant para VisitParticipantResponse"""
        return VisitParticipantResponse(
            id=participant.id,
            visit_id=participant.visit_id,
            user_id=participant.user_id,
            role=participant.role,
            check_in_time=participant.check_in_time,
            check_out_time=participant.check_out_time,
            created_at=participant.created_at,
            updated_at=participant.updated_at
        )
