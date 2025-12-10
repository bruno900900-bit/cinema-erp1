import { toInputDate } from '../../utils/date';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Add,
  Remove,
  CalendarToday,
  AttachMoney,
  LocationOn,
  CheckCircle,
} from '@mui/icons-material';
import { Location, ProjectLocation, RentalStatus } from '../../types/user';

interface LocationSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (projectLocations: ProjectLocation[]) => void;
  availableLocations: Location[];
  projectStartDate?: Date;
  projectEndDate?: Date;
}

// Extended interface for local state
interface ExtendedProjectLocation extends ProjectLocation {
  priceType?: 'cinema' | 'publicidade';
}

export default function LocationSelectionModal({
  open,
  onClose,
  onConfirm,
  availableLocations,
  projectStartDate,
  projectEndDate,
}: LocationSelectionModalProps) {
  const [selectedLocations, setSelectedLocations] = useState<
    ExtendedProjectLocation[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedLocations([]);
    }
  }, [open]);

  const handleAddLocation = (location: Location) => {
    const existingLocation = selectedLocations.find(
      pl => pl.location_id === location.id
    );

    if (existingLocation) {
      return; // Já está selecionada
    }

    // Default to 'cinema' unless it's strictly 0/null and publicidade has value
    let initialPriceType: 'cinema' | 'publicidade' = 'cinema';
    if (!location.price_day_cinema && location.price_day_publicidade) {
      initialPriceType = 'publicidade';
    }

    const dailyRate =
      initialPriceType === 'cinema'
        ? location.price_day_cinema || 0
        : location.price_day_publicidade || 0;

    const projectLocation: ExtendedProjectLocation = {
      id: `temp_${Date.now()}`,
      location_id: location.id,
      location: location,
      rental_start: projectStartDate || new Date(),
      rental_end: projectEndDate || new Date(),
      daily_rate: dailyRate,
      total_cost: 0,
      status: RentalStatus.RESERVED,
      notes: '',
      priceType: initialPriceType,
      // Datas de produção
      visit_date: undefined,
      technical_visit_date: undefined,
      filming_start_date: undefined,
      filming_end_date: undefined,
      delivery_date: undefined,
    };

    // Calcular custo total
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (projectLocation.rental_end.getTime() -
          projectLocation.rental_start.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    projectLocation.total_cost = projectLocation.daily_rate * daysDiff;

    setSelectedLocations(prev => [...prev, projectLocation]);
  };

  const handleRemoveLocation = (locationId: number) => {
    setSelectedLocations(prev =>
      prev.filter(pl => pl.location_id !== locationId)
    );
  };

  const handleDateChange = (
    locationId: number,
    field: 'rental_start' | 'rental_end',
    value: string
  ) => {
    setSelectedLocations(prev =>
      prev.map(pl => {
        if (pl.location_id === locationId) {
          const newDate = new Date(value);
          const otherDate =
            field === 'rental_start' ? pl.rental_end : pl.rental_start;

          // Calcular novo custo total
          // Ensure valid date range calculation
          const startDate =
            field === 'rental_start' ? newDate : pl.rental_start;
          const endDate = field === 'rental_end' ? newDate : pl.rental_end;

          const daysDiff = Math.max(
            1,
            Math.ceil(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
          const totalCost = Math.max(0, pl.daily_rate * daysDiff);

          return {
            ...pl,
            [field]: newDate,
            total_cost: totalCost,
          };
        }
        return pl;
      })
    );
  };

  const handleDailyRateChange = (locationId: number, value: number) => {
    setSelectedLocations(prev =>
      prev.map(pl => {
        if (pl.location_id === locationId) {
          const daysDiff = Math.max(
            1,
            Math.ceil(
              (pl.rental_end.getTime() - pl.rental_start.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          const totalCost = Math.max(0, value * daysDiff);

          return {
            ...pl,
            daily_rate: value,
            total_cost: totalCost,
          };
        }
        return pl;
      })
    );
  };

  const handlePriceTypeChange = (
    locationId: number,
    type: 'cinema' | 'publicidade'
  ) => {
    setSelectedLocations(prev =>
      prev.map(pl => {
        if (pl.location_id === locationId) {
          const newDailyRate =
            type === 'cinema'
              ? pl.location.price_day_cinema || 0
              : pl.location.price_day_publicidade || 0;

          const daysDiff = Math.max(
            1,
            Math.ceil(
              (pl.rental_end.getTime() - pl.rental_start.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          const totalCost = Math.max(0, newDailyRate * daysDiff);

          return {
            ...pl,
            priceType: type,
            daily_rate: newDailyRate,
            total_cost: totalCost,
          };
        }
        return pl;
      })
    );
  };

  const handleNotesChange = (locationId: number, value: string) => {
    setSelectedLocations(prev =>
      prev.map(pl => {
        if (pl.location_id === locationId) {
          return { ...pl, notes: value };
        }
        return pl;
      })
    );
  };

  // Handler para datas de produção
  const handleProductionDateChange = (
    locationId: number,
    field:
      | 'visit_date'
      | 'technical_visit_date'
      | 'filming_start_date'
      | 'filming_end_date'
      | 'delivery_date',
    value: string
  ) => {
    setSelectedLocations(prev =>
      prev.map(pl => {
        if (pl.location_id === locationId) {
          return { ...pl, [field]: value || undefined };
        }
        return pl;
      })
    );
  };

  const handleConfirm = () => {
    if (selectedLocations.length === 0) return;

    setLoading(true);

    // Debug log for save error investigation
    console.log('Confirming locations payload:', selectedLocations);

    // Simular processamento
    setTimeout(() => {
      onConfirm(selectedLocations);
      setLoading(false);
      onClose();
    }, 1000);
  };

  const totalProjectCost = selectedLocations.reduce(
    (sum, pl) => sum + pl.total_cost,
    0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" component="h2">
            Selecionar Locações para o Projeto
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Locações Disponíveis */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Locações Disponíveis ({availableLocations.length})
            </Typography>

            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {availableLocations.map(location => {
                const isSelected = selectedLocations.some(
                  pl => pl.location_id === location.id
                );

                return (
                  <Paper
                    key={location.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '2px solid',
                      borderColor: isSelected ? 'success.main' : 'transparent',
                      bgcolor: isSelected ? 'success.50' : 'background.paper',
                      cursor: isSelected ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: isSelected
                          ? 'success.main'
                          : 'primary.light',
                        bgcolor: isSelected ? 'success.50' : 'primary.25',
                      },
                    }}
                    onClick={() => !isSelected && handleAddLocation(location)}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ flex: 1 }}
                      >
                        {location.title}
                      </Typography>
                      {isSelected && <CheckCircle color="success" />}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {location.city}, {location.state}
                    </Typography>

                    <Box
                      sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}
                    >
                      <Chip
                        label={location.sector_type}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={location.space_type}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney
                        sx={{ fontSize: 16, color: 'text.secondary' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Cinema: R$ {location.price_day_cinema || 0} / Publi: R${' '}
                        {location.price_day_publicidade || 0}
                      </Typography>
                    </Box>

                    {!isSelected && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={e => {
                          e.stopPropagation();
                          handleAddLocation(location);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Adicionar ao Projeto
                      </Button>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Grid>

          {/* Locações Selecionadas */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Locações Selecionadas ({selectedLocations.length})
            </Typography>

            {selectedLocations.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhuma locação selecionada
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Clique nas locações disponíveis para adicioná-las ao projeto
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {selectedLocations.map(projectLocation => (
                  <Paper
                    key={projectLocation.id}
                    sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {projectLocation.location.title}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleRemoveLocation(projectLocation.location_id)
                        }
                      >
                        <Remove />
                      </IconButton>
                    </Box>

                    {/* Price Type Selection */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tipo de Uso:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Button
                          size="small"
                          variant={
                            projectLocation.priceType === 'cinema'
                              ? 'contained'
                              : 'outlined'
                          }
                          onClick={() =>
                            handlePriceTypeChange(
                              projectLocation.location_id,
                              'cinema'
                            )
                          }
                          sx={{ borderRadius: 10 }}
                        >
                          Cinema
                        </Button>
                        <Button
                          size="small"
                          variant={
                            projectLocation.priceType === 'publicidade'
                              ? 'contained'
                              : 'outlined'
                          }
                          onClick={() =>
                            handlePriceTypeChange(
                              projectLocation.location_id,
                              'publicidade'
                            )
                          }
                          sx={{ borderRadius: 10 }}
                        >
                          Publicidade
                        </Button>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Data de Início"
                          type="date"
                          value={toInputDate(projectLocation.rental_start)}
                          onChange={e =>
                            handleDateChange(
                              projectLocation.location_id,
                              'rental_start',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Data de Fim"
                          type="date"
                          value={toInputDate(projectLocation.rental_end)}
                          onChange={e =>
                            handleDateChange(
                              projectLocation.location_id,
                              'rental_end',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Taxa Diária (R$)"
                          type="number"
                          value={projectLocation.daily_rate}
                          onChange={e =>
                            handleDailyRateChange(
                              projectLocation.location_id,
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          helperText="Editável"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Custo Total (R$)"
                          value={projectLocation.total_cost.toFixed(2)}
                          InputProps={{ readOnly: true }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Observações"
                          value={projectLocation.notes || ''}
                          onChange={e =>
                            handleNotesChange(
                              projectLocation.location_id,
                              e.target.value
                            )
                          }
                          multiline
                          rows={2}
                          size="small"
                        />
                      </Grid>

                      {/* ===== DATAS DE PRODUÇÃO ===== */}
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                          sx={{ fontWeight: 'bold' }}
                        >
                          📅 Datas de Produção
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="🟣 Data de Visitação"
                          type="date"
                          value={
                            projectLocation.visit_date
                              ? String(projectLocation.visit_date).split('T')[0]
                              : ''
                          }
                          onChange={e =>
                            handleProductionDateChange(
                              projectLocation.location_id,
                              'visit_date',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          helperText="Primeira visita ao local"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="🔵 Visita Técnica"
                          type="date"
                          value={
                            projectLocation.technical_visit_date
                              ? String(
                                  projectLocation.technical_visit_date
                                ).split('T')[0]
                              : ''
                          }
                          onChange={e =>
                            handleProductionDateChange(
                              projectLocation.location_id,
                              'technical_visit_date',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          helperText="Avaliação técnica do espaço"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="🟢 Início de Gravação"
                          type="date"
                          value={
                            projectLocation.filming_start_date
                              ? String(
                                  projectLocation.filming_start_date
                                ).split('T')[0]
                              : ''
                          }
                          onChange={e =>
                            handleProductionDateChange(
                              projectLocation.location_id,
                              'filming_start_date',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="🟢 Fim de Gravação"
                          type="date"
                          value={
                            projectLocation.filming_end_date
                              ? String(projectLocation.filming_end_date).split(
                                  'T'
                                )[0]
                              : ''
                          }
                          onChange={e =>
                            handleProductionDateChange(
                              projectLocation.location_id,
                              'filming_end_date',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="🟠 Entrega da Locação"
                          type="date"
                          value={
                            projectLocation.delivery_date
                              ? String(projectLocation.delivery_date).split(
                                  'T'
                                )[0]
                              : ''
                          }
                          onChange={e =>
                            handleProductionDateChange(
                              projectLocation.location_id,
                              'delivery_date',
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          helperText="Data de devolução do local"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Resumo de Custos */}
            {selectedLocations.length > 0 && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.50' }}>
                <Typography variant="h6" gutterBottom>
                  Resumo do Projeto
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body1">
                    Total de Locações: {selectedLocations.length}
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    Custo Total: R$ {totalProjectCost.toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || selectedLocations.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
        >
          {loading
            ? 'Processando...'
            : `Confirmar ${selectedLocations.length} Locação(ões)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
