import pytest
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO
from app.services.presentation_export_service import PresentationExportService
from app.schemas.presentation_export import PresentationExportRequest
from app.models.location import Location, LocationStatus, SectorType, SpaceType


class TestPresentationExportService:
    """Testes para o serviço de exportação de apresentações"""

    @pytest.fixture
    def mock_db(self):
        """Mock do banco de dados"""
        return Mock()

    @pytest.fixture
    def mock_location(self):
        """Mock de uma locação"""
        location = Mock(spec=Location)
        location.id = 1
        location.title = "Estúdio de Cinema"
        location.description = "Estúdio profissional para filmagens"
        location.status = LocationStatus.APPROVED
        location.city = "São Paulo"
        location.state = "SP"
        location.country = "Brasil"
        location.capacity = 50
        location.area_size = 200.0
        location.price_day_cinema = 5000.0
        location.price_hour_cinema = 800.0
        location.price_day_publicidade = 4000.0
        location.price_hour_publicidade = 600.0
        location.photos = []
        location.location_tags = []
        return location

    @pytest.fixture
    def export_request(self):
        """Requisição de exportação de teste"""
        return PresentationExportRequest(
            location_ids=[1, 2, 3],
            order=[0, 1, 2],
            include_photos=True,
            include_summary=True,
            template_name="default"
        )

    def test_init(self, mock_db):
        """Testa a inicialização do serviço"""
        service = PresentationExportService(mock_db)
        assert service.db == mock_db

    def test_get_locations_in_order(self, mock_db, mock_location):
        """Testa a busca de locações na ordem especificada"""
        # Mock da query
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.all.return_value = [mock_location]

        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter

        service = PresentationExportService(mock_db)
        request = PresentationExportRequest(
            location_ids=[1],
            order=[0],
            include_photos=True,
            include_summary=True,
            template_name="default"
        )

        locations = service._get_locations_in_order(request.location_ids, request.order)

        assert len(locations) == 1
        assert locations[0].id == 1
        mock_db.query.assert_called_once_with(Location)

    def test_format_address(self, mock_db, mock_location):
        """Testa a formatação do endereço"""
        service = PresentationExportService(mock_db)

        # Teste com todos os campos
        address = service._format_address(mock_location)
        assert address == "São Paulo, SP, Brasil"

        # Teste com campos faltando
        mock_location.city = None
        address = service._format_address(mock_location)
        assert address == "SP, Brasil"

        # Teste sem endereço
        mock_location.state = None
        mock_location.country = None
        address = service._format_address(mock_location)
        assert address == "Endereço não informado"

    def test_get_location_price(self, mock_db, mock_location):
        """Testa a obtenção do preço da locação"""
        service = PresentationExportService(mock_db)

        # Teste com preço de cinema por dia
        price = service._get_location_price(mock_location)
        assert "R$ 5.000,00/dia (Cinema)" in price

        # Teste com preço de publicidade por hora
        mock_location.price_day_cinema = None
        mock_location.price_hour_cinema = None
        mock_location.price_day_publicidade = None
        price = service._get_location_price(mock_location)
        assert "R$ 600,00/hora (Publicidade)" in price

        # Teste sem preços
        mock_location.price_hour_publicidade = None
        price = service._get_location_price(mock_location)
        assert price == "Preço sob consulta"

    def test_get_status_color(self, mock_db):
        """Testa a obtenção da cor do status"""
        service = PresentationExportService(mock_db)

        # Teste com status conhecido
        color = service._get_status_color("approved")
        assert color is not None

        # Teste com status desconhecido
        color = service._get_status_color("unknown_status")
        assert color is not None  # Deve retornar cor padrão

    @patch('app.services.presentation_export_service.Presentation')
    def test_create_presentation(self, mock_presentation_class, mock_db, mock_location, export_request):
        """Testa a criação da apresentação"""
        # Mock da apresentação
        mock_presentation = Mock()
        mock_presentation_class.return_value = mock_presentation

        # Mock dos slides
        mock_slide_layouts = [Mock(), Mock(), Mock(), Mock(), Mock(), Mock(), Mock()]
        mock_presentation.slide_layouts = mock_slide_layouts

        # Mock da query
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.all.return_value = [mock_location]

        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter

        service = PresentationExportService(mock_db)

        # Mock do BytesIO
        with patch('io.BytesIO') as mock_bytesio:
            mock_bytesio_instance = Mock()
            mock_bytesio.return_value = mock_bytesio_instance
            mock_bytesio_instance.getvalue.return_value = b"fake_pptx_content"

            result = service.create_presentation(export_request)

            assert result == b"fake_pptx_content"
            mock_presentation.save.assert_called_once()

    def test_validation_errors(self, mock_db):
        """Testa os erros de validação"""
        service = PresentationExportService(mock_db)

        # Teste com IDs e ordem de tamanhos diferentes
        with pytest.raises(ValueError):
            service._get_locations_in_order([1, 2], [0])

        # Teste com IDs duplicados
        with pytest.raises(ValueError):
            service._get_locations_in_order([1, 1], [0, 1])

    def test_empty_locations(self, mock_db):
        """Testa o comportamento com lista vazia de locações"""
        service = PresentationExportService(mock_db)

        # Mock da query vazia
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.all.return_value = []

        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter

        locations = service._get_locations_in_order([], [])
        assert len(locations) == 0


if __name__ == "__main__":
    pytest.main([__file__])
