from pydantic import BaseModel, Field
from typing import List, Optional


class SelectedLocationPhotos(BaseModel):
    """Mapa de fotos selecionadas por locação"""

    location_id: int = Field(
        ...,
        description="ID da locação a que as fotos pertencem"
    )

    photo_ids: List[int] = Field(
        default_factory=list,
        description="Lista de IDs das fotos selecionadas na ordem desejada"
    )


class PresentationExportRequest(BaseModel):
    """Schema para requisição de exportação de apresentação"""

    location_ids: List[int] = Field(
        ...,
        description="Lista de IDs das locações a serem incluídas na apresentação",
        min_items=1,
        max_items=50
    )

    order: List[int] = Field(
        ...,
        description="Ordem das locações na apresentação (deve ter o mesmo tamanho de location_ids)"
    )

    include_photos: bool = Field(
        default=True,
        description="Incluir fotos das locações na apresentação"
    )

    include_summary: bool = Field(
        default=True,
        description="Incluir slide de resumo com estatísticas"
    )

    template_name: str = Field(
        default="default",
        description="Nome do template de apresentação a ser usado"
    )

    selected_photos: Optional[List[SelectedLocationPhotos]] = Field(
        default=None,
        description="Lista de fotos selecionadas para cada locação"
    )

    title: Optional[str] = Field(
        default=None,
        description="Título personalizado para o slide inicial"
    )

    subtitle: Optional[str] = Field(
        default=None,
        description="Subtítulo personalizado para o slide inicial"
    )

    class Config:
        schema_extra = {
            "example": {
                "location_ids": [1, 2, 3, 4],
                "order": [3, 1, 4, 2],
                "include_photos": True,
                "include_summary": True,
                "template_name": "default",
                "title": "Apresentação de Locações",
                "subtitle": "Cinema ERP",
                "selected_photos": [
                    {"location_id": 1, "photo_ids": [10, 11, 12]},
                    {"location_id": 2, "photo_ids": [30]}
                ]
            }
        }


class PresentationExportResponse(BaseModel):
    """Schema para resposta de exportação de apresentação"""

    success: bool = Field(..., description="Indica se a exportação foi bem-sucedida")

    message: str = Field(..., description="Mensagem descritiva do resultado")

    file_name: str = Field(..., description="Nome do arquivo gerado")

    file_size: int = Field(..., description="Tamanho do arquivo em bytes")

    total_slides: int = Field(..., description="Total de slides na apresentação")

    locations_included: int = Field(..., description="Número de locações incluídas")

    download_url: str = Field(..., description="URL para download do arquivo")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Apresentação gerada com sucesso",
                "file_name": "apresentacao_locacoes_2024.pptx",
                "file_size": 2048576,
                "total_slides": 6,
                "locations_included": 4,
                "download_url": "/api/export/download/abc123"
            }
        }
