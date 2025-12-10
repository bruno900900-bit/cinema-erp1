from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

class ProjectService:
    def __init__(self, db: Session):
        self.db = db

    def create_project(self, project_data: ProjectCreate) -> ProjectResponse:
        """Cria um novo projeto"""
        try:
            # Converter dados do frontend para o formato do banco
            project_dict = project_data.dict()

            # Mapear title para name se necessário
            if 'title' in project_dict and project_dict['title']:
                project_dict['name'] = project_dict['title']

            # Mapear budget para budget_total se necessário
            if 'budget' in project_dict and project_dict['budget'] is not None:
                project_dict['budget_total'] = project_dict['budget']

            # Garantir que temos um usuário válido para created_by
            from ..models.user import User

            # Primeiro, tentar encontrar um usuário existente
            first_user = self.db.query(User).first()

            if not first_user:
                # Se não há usuários, criar um usuário padrão do sistema
                print("⚠️  Nenhum usuário encontrado. Criando usuário padrão do sistema...")
                default_user = User(
                    email="system@cinema-erp.com",
                    full_name="Sistema Cinema ERP",
                    password_hash="$2b$12$LQv3c1yqBwt4.KOKxMxSce65vQs8Hb0Hkv7QIQHwA1E8GjKGz2kJ6",  # Hash para senha 'admin123'
                    role="admin",
                    is_active=True
                )
                self.db.add(default_user)
                self.db.flush()  # Para obter o ID sem fazer commit completo
                project_dict['created_by'] = default_user.id
                print(f"✅ Usuário do sistema criado com ID: {default_user.id}")
            else:
                project_dict['created_by'] = first_user.id
                print(f"ℹ️  Usando usuário existente ID: {first_user.id} ({first_user.email})")

            # Remover campos que não existem no modelo Project
            # e campos computados que não devem ser gravados diretamente
            fields_to_remove = ['title', 'budget', 'responsibleUserId', 'budget_remaining']
            for field in fields_to_remove:
                project_dict.pop(field, None)

            # Garantir campos obrigatórios com valores padrão se não fornecidos
            if 'status' not in project_dict or not project_dict['status']:
                from ..models.project import ProjectStatus
                project_dict['status'] = ProjectStatus.ACTIVE

            print(f"📋 Criando projeto com dados: {project_dict}")

            # Criar o projeto
            project = Project(**project_dict)
            self.db.add(project)
            self.db.commit()
            self.db.refresh(project)

            print(f"✅ Projeto criado com sucesso! ID: {project.id}")
            return ProjectResponse.from_orm(project)

        except Exception as e:
            print(f"❌ Erro ao criar projeto: {str(e)}")
            print(f"📋 Dados que causaram erro: {project_dict}")
            self.db.rollback()
            raise e

    def get_project(self, project_id: int) -> Optional[ProjectResponse]:
        """Obtém um projeto por ID"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
        return ProjectResponse.from_orm(project)

    def get_projects(self, skip: int = 0, limit: int = 100) -> List[ProjectResponse]:
        """Lista projetos"""
        projects = self.db.query(Project).offset(skip).limit(limit).all()
        return [ProjectResponse.from_orm(project) for project in projects]

    def update_project(self, project_id: int, project_data: ProjectUpdate) -> Optional[ProjectResponse]:
        """Atualiza um projeto"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        update_data = project_data.dict(exclude_unset=True)

        # Mapear atualizações compatíveis com o banco
        if 'title' in update_data and update_data['title']:
            update_data['name'] = update_data.pop('title')
        if 'budget' in update_data and update_data['budget'] is not None:
            update_data['budget_total'] = update_data.pop('budget')

        # Remover campos que não devem ser atualizados diretamente
        for field in ['budget_remaining', 'responsibleUserId']:
            update_data.pop(field, None)

        for field, value in update_data.items():
            setattr(project, field, value)

        self.db.commit()
        self.db.refresh(project)
        return ProjectResponse.from_orm(project)

    def delete_project(self, project_id: int) -> bool:
        """Remove um projeto"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False

        self.db.delete(project)
        self.db.commit()
        return True

    # --- Gerenciamento de Tarefas ---
    def create_task(self, project_id: int, task_data: 'ProjectTaskCreate') -> 'ProjectTaskResponse':
        from ..models.project_task import ProjectTask
        from ..schemas.project_task import ProjectTaskResponse

        # Verificar se projeto existe
        project = self.get_project(project_id)
        if not project:
            return None

        task_dict = task_data.dict()
        task_dict['project_id'] = project_id

        task = ProjectTask(**task_dict)
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return ProjectTaskResponse.from_orm(task)

    def update_task(self, task_id: int, task_data: 'ProjectTaskUpdate') -> Optional['ProjectTaskResponse']:
        from ..models.project_task import ProjectTask
        from ..schemas.project_task import ProjectTaskResponse

        task = self.db.query(ProjectTask).filter(ProjectTask.id == task_id).first()
        if not task:
            return None

        update_data = task_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        self.db.commit()
        self.db.refresh(task)
        return ProjectTaskResponse.from_orm(task)

    def delete_task(self, task_id: int) -> bool:
        from ..models.project_task import ProjectTask

        task = self.db.query(ProjectTask).filter(ProjectTask.id == task_id).first()
        if not task:
            return False

        self.db.delete(task)
        self.db.commit()
        return True

    # --- Gerenciamento de Tags ---
    def add_tag(self, project_id: int, tag_data: 'TagCreate') -> Optional['TagResponse']:
        from ..models.tag import Tag, TagKind
        from ..models.project_tag import ProjectTag
        from ..schemas.tag import TagResponse

        # Verificar se projeto existe
        if not self.get_project(project_id):
            return None

        # Verificar se tag existe ou criar nova
        tag = self.db.query(Tag).filter(Tag.name == tag_data.name).first()
        if not tag:
            tag = Tag(
                name=tag_data.name,
                kind=tag_data.kind,
                description=tag_data.description,
                color=tag_data.color
            )
            self.db.add(tag)
            self.db.commit()
            self.db.refresh(tag)

        # Verificar se já está associada
        association = self.db.query(ProjectTag).filter(
            ProjectTag.project_id == project_id,
            ProjectTag.tag_id == tag.id
        ).first()

        if not association:
            association = ProjectTag(project_id=project_id, tag_id=tag.id)
            self.db.add(association)
            self.db.commit()

        return TagResponse.from_orm(tag)

    def remove_tag(self, project_id: int, tag_id: int) -> bool:
        from ..models.project_tag import ProjectTag

        association = self.db.query(ProjectTag).filter(
            ProjectTag.project_id == project_id,
            ProjectTag.tag_id == tag_id
        ).first()

        if not association:
            return False

        self.db.delete(association)
        self.db.commit()
        return True
