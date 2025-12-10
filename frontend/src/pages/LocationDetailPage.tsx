import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Archive,
  LocationOn,
  Phone,
  Email,
  AttachMoney,
  Photo,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { locationService } from '../services/locationService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { Location, SectorType } from '../types/user';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`location-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const { data: location, isLoading } = useQuery<Location>({
    queryKey: ['location', locationId],
    queryFn: () => locationService.getLocationById(Number(locationId)),
    enabled: !!locationId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!location) {
    return (
      <Container>
        <Typography>Locação não encontrada</Typography>
      </Container>
    );
  }

  const getSectorLabel = (sector: SectorType) => {
    return sector === SectorType.CINEMA ? 'Cinema' : 'Publicidade';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/locations')}
          sx={{ mb: 2 }}
        >
          Voltar para Locações
        </Button>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {location.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {location.sector_types?.map(sector => (
                <Chip
                  key={sector}
                  label={getSectorLabel(sector)}
                  color="primary"
                  size="small"
                />
              ))}
              <Chip label={location.status} size="small" variant="outlined" />
              {location.city && (
                <Typography variant="body2" color="text.secondary">
                  <LocationOn sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                  {location.city}, {location.state}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/locations/${locationId}/edit`)}
            >
              Editar
            </Button>
            <Button variant="outlined" color="warning" startIcon={<Archive />}>
              Arquivar
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Informações Gerais" />
          <Tab label="Preços" />
          <Tab label="Fotos" />
        </Tabs>

        {/* Tab: Informações Gerais */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Endereço */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Endereço
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" paragraph>
                    {location.city}, {location.state}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.country}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Contatos */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contatos
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {location.supplier_name && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Fornecedor</Typography>
                      <Typography variant="body2">
                        {location.supplier_name}
                      </Typography>
                    </Box>
                  )}
                  {location.supplier_phone && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Phone sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        {location.supplier_phone}
                      </Typography>
                    </Box>
                  )}
                  {location.supplier_email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        {location.supplier_email}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Características */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Características
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {location.capacity && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="subtitle2">Capacidade</Typography>
                        <Typography variant="body2">
                          {location.capacity} pessoas
                        </Typography>
                      </Grid>
                    )}
                    {location.area_size && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="subtitle2">Área</Typography>
                        <Typography variant="body2">
                          {location.area_size} m²
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2">
                        Estacionamento
                      </Typography>
                      <Typography variant="body2">
                        {location.has_parking ? 'Sim' : 'Não'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2">
                        Ar Condicionado
                      </Typography>
                      <Typography variant="body2">
                        {location.has_air_conditioning ? 'Sim' : 'Não'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Descrição */}
            {location.description && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Descrição
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {location.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab: Preços */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            {location.sector_types?.includes(SectorType.CINEMA) && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Cinema
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Diária:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {location.price_day_cinema
                          ? `${
                              location.currency
                            } ${location.price_day_cinema.toFixed(2)}`
                          : 'N/A'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant="body2">Hora:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {location.price_hour_cinema
                          ? `${
                              location.currency
                            } ${location.price_hour_cinema.toFixed(2)}`
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {location.sector_types?.includes(SectorType.PUBLICIDADE) && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="secondary">
                      Publicidade
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Diária:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {location.price_day_publicidade
                          ? `${
                              location.currency
                            } ${location.price_day_publicidade.toFixed(2)}`
                          : 'N/A'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant="body2">Hora:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {location.price_hour_publicidade
                          ? `${
                              location.currency
                            } ${location.price_hour_publicidade.toFixed(2)}`
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab: Fotos */}
        <TabPanel value={currentTab} index={2}>
          <Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}
            >
              <Typography variant="h6">Galeria de Fotos</Typography>
              <Button variant="contained" startIcon={<Photo />}>
                Upload de Fotos
              </Button>
            </Box>

            {location.photos && location.photos.length > 0 ? (
              <ImageList cols={3} gap={16}>
                {location.photos.map(photo => (
                  <ImageListItem key={photo.id}>
                    <img
                      src={photo.url}
                      alt={photo.caption || location.title}
                      loading="lazy"
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                    <ImageListItemBar
                      title={photo.caption}
                      actionIcon={
                        <IconButton sx={{ color: 'white' }}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Photo sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Nenhuma foto adicionada ainda
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Clique em "Upload de Fotos" para adicionar imagens
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}
