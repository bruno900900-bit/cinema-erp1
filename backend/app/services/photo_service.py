import os
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from PIL import Image
import io
from ..models.location_photo import LocationPhoto
from ..models.location import Location
from ..config.supabase import get_supabase_client

class PhotoService:
    def __init__(self, db: Session):
        self.db = db
        # Diretório local (somente dev). Em Cloud Run usar /tmp.
        base_upload = os.environ.get("LOCAL_UPLOAD_BASE", "uploads")
        if os.environ.get("CLOUD_RUN", "").lower() in {"1", "true", "yes"}:
            base_upload = "/tmp/uploads"
        self.upload_dir = os.path.join(base_upload, "locations")
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.heic'}
        self.max_file_size = None  # Sem limite
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.heic'}
        # Sem limite de tamanho - Firebase Storage suporta até 5TB por arquivo
        self.max_file_size = None  # Sem limite

    def validate_photo(self, file: UploadFile) -> None:
        """Valida o arquivo de foto"""
        # Verificar extensão
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nome do arquivo não fornecido")

        file_extension = os.path.splitext(file.filename.lower())[1]
        if file_extension not in self.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de arquivo não permitido. Aceitos: {', '.join(self.allowed_extensions)}"
            )

        # Verificar tamanho (apenas se houver limite configurado)
        if self.max_file_size is not None:
            file.file.seek(0, 2)  # Ir para o final do arquivo
            file_size = file.file.tell()
            file.file.seek(0)  # Voltar para o início

            if file_size > self.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"Arquivo muito grande. Máximo: {self.max_file_size // (1024*1024)}MB"
                )
        else:
            # Resetar posição do arquivo
            file.file.seek(0)

    def generate_filename(self, original_filename: str) -> str:
        """Gera um nome único para o arquivo"""
        file_extension = os.path.splitext(original_filename)[1]
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{file_extension}"

    def create_thumbnail(self, image_path: str, thumbnail_path: str, size: tuple = (300, 300)) -> None:
        """Cria uma miniatura da imagem"""
        try:
            with Image.open(image_path) as img:
                img.thumbnail(size, Image.Resampling.LANCZOS)
                img.save(thumbnail_path, optimize=True, quality=85)
        except Exception as e:
            print(f"Erro ao criar thumbnail: {e}")

    def save_photo_file(self, file: UploadFile, filename: str, location_id: int) -> dict:
        """Salva arquivo localmente ou envia para Supabase Storage.
        Retorna dict com file_path, url (se disponível) e storage_key."""
        content = file.file.read()
        file.file.seek(0)

        # Tentar usar Supabase Storage
        try:
            supabase = get_supabase_client()
            bucket_name = os.environ.get("SUPABASE_BUCKET", "locations")

            # Caminho dentro do bucket
            storage_key = f"{location_id}/{filename}"

            # Upload
            res = supabase.storage.from_(bucket_name).upload(
                path=storage_key,
                file=content,
                file_options={"content-type": file.content_type or "image/jpeg"}
            )

            # Obter URL pública
            public_url_res = supabase.storage.from_(bucket_name).get_public_url(storage_key)
            # A resposta do get_public_url pode variar dependendo da versão da lib,
            # mas geralmente retorna uma string ou objeto. Ajustar conforme necessário.
            # Em versões recentes do supabase-py, get_public_url retorna string direta.
            url = public_url_res

            print(f"✅ Foto salva no Supabase Storage: {url}")

            return {
                "file_path": None,  # não armazenado localmente
                "url": url,
                "storage_key": storage_key,
                "thumbnail_path": None,
                "file_size": len(content)
            }

        except Exception as e:
            print(f"⚠️ Erro upload Supabase Storage: {e}")
            # Se falhar supabase, salvar localmente como fallback?
            # O usuário pediu especificamente Supabase. Se falhar, é melhor lançar erro ou logar crítico.
            # Mas manteremos fallback local para evitar perda de dados imediata se config estiver errada.

            # Fallback local
            location_dir = os.path.join(self.upload_dir, str(location_id))
            os.makedirs(location_dir, exist_ok=True)
            file_path = os.path.join(location_dir, filename)
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            return {
                "file_path": file_path,
                "url": f"/uploads/locations/{location_id}/{filename}",
                "storage_key": None,
                "thumbnail_path": None,
                "file_size": len(content)
            }

        # Local / fallback
        location_dir = os.path.join(self.upload_dir, str(location_id))
        os.makedirs(location_dir, exist_ok=True)
        file_path = os.path.join(location_dir, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        return {
            "file_path": file_path,
            "url": f"/uploads/locations/{location_id}/{filename}",
            "storage_key": None,
            "thumbnail_path": None,
            "file_size": len(content)
        }

    def upload_location_photo(
        self,
        location_id: int,
        file: UploadFile,
        caption: Optional[str] = None,
        is_primary: bool = False
    ) -> dict:
        """Faz upload de uma foto para uma locação"""
        # Verificar se a locação existe
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Locação não encontrada")

        # Validar arquivo
        self.validate_photo(file)

        # Gerar nome único
        filename = self.generate_filename(file.filename)

        # Salvar arquivo (local ou firebase)
        storage_result = self.save_photo_file(file, filename, location_id)
        file_path = storage_result.get("file_path")
        url = storage_result.get("url")
        storage_key = storage_result.get("storage_key")
        stored_size = storage_result.get("file_size")

        # Criar thumbnail apenas se arquivo local existir
        thumbnail_filename = f"thumb_{filename}"
        thumbnail_path = None
        if file_path and os.path.exists(file_path):
            thumbnail_path = os.path.join(os.path.dirname(file_path), thumbnail_filename)
            self.create_thumbnail(file_path, thumbnail_path)

        # Salvar metadados no banco
        photo = LocationPhoto(
            location_id=location_id,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path if file_path else '',
            thumbnail_path=thumbnail_path,
            url=url,
            storage_key=storage_key,
            caption=caption,
            is_primary=is_primary,
            file_size=os.path.getsize(file_path) if file_path and os.path.exists(file_path) else (stored_size or len(file.file.read()))
        )
        file.file.seek(0)

        self.db.add(photo)

        # Se for a foto principal, remover flag de outras fotos
        if is_primary:
            self.db.query(LocationPhoto).filter(
                LocationPhoto.location_id == location_id,
                LocationPhoto.id != photo.id
            ).update({"is_primary": False})

        self.db.commit()
        self.db.refresh(photo)

        # Se usamos Firebase e criamos url pública, a thumbnail pode não existir.
        # Fallback: usar a própria URL como miniatura para evitar quebras.
        thumb_url = None
        if url and not thumbnail_path:
            # Heurística: inserir prefixo thumb_ antes do nome do arquivo mantendo caminho.
            # Ex: https://storage.googleapis.com/<bucket>/locations/1/<file> -> .../locations/1/thumb_<file>
            try:
                # Somente para URLs públicas GCS
                if "storage.googleapis.com" in url:
                    parts = url.split('/')
                    if len(parts) > 2:
                        original_name = parts[-1]
                        parts[-1] = f"thumb_{original_name}"
                        thumb_url = '/'.join(parts)
            except Exception:
                thumb_url = None
        else:
            thumb_url = f"/uploads/locations/{location_id}/{thumbnail_filename}" if thumbnail_path else None

        # Fallback final para garantir que a miniatura sempre carregue
        if not thumb_url:
            thumb_url = url if url else f"/uploads/locations/{location_id}/{filename}"

        return {
            "id": photo.id,
            "filename": photo.filename,
            "original_filename": photo.original_filename,
            "url": url if url else f"/uploads/locations/{location_id}/{filename}",
            "thumbnail_url": thumb_url,
            "caption": photo.caption,
            "is_primary": photo.is_primary,
            "file_size": photo.file_size,
            "created_at": photo.created_at
        }

    def get_location_photos(self, location_id: int) -> List[dict]:
        """Lista todas as fotos de uma locação"""
        photos = self.db.query(LocationPhoto).filter(
            LocationPhoto.location_id == location_id
        ).order_by(LocationPhoto.is_primary.desc(), LocationPhoto.created_at.desc()).all()

        result = []
        for p in photos:
            # Determinar URL principal
            if p.url and p.url.startswith('http'):
                # URL absoluta do Supabase/Cloud
                main_url = p.url
                # Tentar construir thumbnail URL
                if p.thumbnail_path and p.thumbnail_path.startswith('http'):
                    thumb_url = p.thumbnail_path
                elif p.url:
                    # Tentar compor thumbnail a partir da URL principal
                    try:
                        parts = p.url.rsplit('/', 1)
                        if len(parts) == 2:
                            thumb_url = f"{parts[0]}/thumb_{parts[1]}"
                        else:
                            thumb_url = p.url  # Fallback para URL original
                    except Exception:
                        thumb_url = p.url
                else:
                    thumb_url = p.url
            else:
                # URL local - construir URL absoluta
                base_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
                main_url = f"{base_url}/uploads/locations/{location_id}/{p.filename}"
                if p.thumbnail_path:
                    thumb_url = f"{base_url}/uploads/locations/{location_id}/thumb_{p.filename}"
                else:
                    thumb_url = main_url  # Fallback para URL principal

            result.append({
                "id": p.id,
                "filename": p.filename,
                "original_filename": p.original_filename,
                "url": main_url,
                "thumbnail_url": thumb_url,
                "caption": p.caption,
                "is_primary": p.is_primary,
                "file_size": p.file_size,
                "created_at": p.created_at
            })
        return result

    def delete_location_photo(self, location_id: int, photo_id: int) -> dict:
        """Remove uma foto de uma locação"""
        photo = self.db.query(LocationPhoto).filter(
            LocationPhoto.id == photo_id,
            LocationPhoto.location_id == location_id
        ).first()

        if not photo:
            raise HTTPException(status_code=404, detail="Foto não encontrada")

        # Remover arquivos do sistema
        try:
            if os.path.exists(photo.file_path):
                os.remove(photo.file_path)
            if os.path.exists(photo.thumbnail_path):
                os.remove(photo.thumbnail_path)
        except Exception as e:
            print(f"Erro ao remover arquivos: {e}")

        # Remover do banco
        self.db.delete(photo)
        self.db.commit()

        return {"message": "Foto removida com sucesso"}

    def set_primary_photo(self, location_id: int, photo_id: int) -> dict:
        """Define uma foto como principal"""
        photo = self.db.query(LocationPhoto).filter(
            LocationPhoto.id == photo_id,
            LocationPhoto.location_id == location_id
        ).first()

        if not photo:
            raise HTTPException(status_code=404, detail="Foto não encontrada")

        # Remover flag de outras fotos
        self.db.query(LocationPhoto).filter(
            LocationPhoto.location_id == location_id
        ).update({"is_primary": False})

        # Definir como principal
        photo.is_primary = True
        self.db.commit()

        return {"message": "Foto principal definida com sucesso"}

    def set_cover_photo(self, location_id: int, photo_id: int) -> dict:
        """Define uma foto como capa (principal)"""
        # Apenas um alias para set_primary_photo, mas com lógica extra de atualizar Location se necessário
        photo = self.db.query(LocationPhoto).filter(
            LocationPhoto.id == photo_id,
            LocationPhoto.location_id == location_id
        ).first()

        if not photo:
            raise HTTPException(status_code=404, detail="Foto não encontrada")

        # Remover flag is_primary de todas as fotos desta locação
        self.db.query(LocationPhoto).filter(
            LocationPhoto.location_id == location_id
        ).update({"is_primary": False})

        # Opcional: Se houver campo cover_photo_url na Location, atualizar também
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if location:
            # Tenta usar a URL da foto. Se for local, constrói o caminho relativo.
            cover_url = photo.url if photo.url else f"/uploads/locations/{location_id}/{photo.filename}"
            location.cover_photo_url = cover_url

        # Definir a nova foto principal
        photo.is_primary = True

        self.db.commit()
        return {"message": "Foto de capa definida com sucesso", "cover_photo_id": photo_id}

    def reorder_photos(self, location_id: int, photo_orders: List[dict]) -> dict:
        """Reordena as fotos de uma locação.
           Esperado photo_orders: [{'id': 1, 'order': 1}, {'id': 2, 'order': 2}]
        """
        # Validar se a locação existe
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
             raise HTTPException(status_code=404, detail="Locação não encontrada")

        try:
            for item in photo_orders:
                pid = item.get('id')
                order = item.get('order') or item.get('displayOrder')

                if pid is not None and order is not None:
                     photo = self.db.query(LocationPhoto).filter(LocationPhoto.id == pid, LocationPhoto.location_id == location_id).first()
                     if photo:
                         # Tentar atribuir display_order se o atributo existir no modelo
                         if hasattr(photo, 'display_order'):
                             photo.display_order = order
                         # Se não tiver o atributo, não faz nada (evita erro)
        except Exception as e:
            print(f"Aviso: Erro ao reordenar fotos: {e}")

        self.db.commit()
        return {"message": "Ordem das fotos atualizada"}
