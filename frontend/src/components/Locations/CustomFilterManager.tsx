import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Save,
  ContentCopy,
  Star,
  StarBorder,
  Palette,
  FilterList,
  Search,
} from '@mui/icons-material';
import { FilterCriteria } from '../../types/customFilter';

interface CustomFilterManagerProps {
  open: boolean;
  onClose: () => void;
  onSave: (filter: CustomFilterData) => void;
  onDuplicate?: (filterId: number, newName: string) => void;
  onSetDefault?: (filterId: number) => void;
  existingFilter?: CustomFilterData | null;
  currentCriteria?: FilterCriteria;
}

interface CustomFilterData {
  id?: number;
  name: string;
  description?: string;
  criteria_json: FilterCriteria;
  scope: 'private' | 'team' | 'public';
  color?: string;
  icon?: string;
  is_default: boolean;
  sort_order: number;
}

const SCOPE_OPTIONS = [
  { value: 'private', label: 'Privado', description: 'Apenas você pode ver' },
  { value: 'team', label: 'Equipe', description: 'Sua equipe pode ver' },
  { value: 'public', label: 'Público', description: 'Todos podem ver' },
];

const COLOR_OPTIONS = [
  '#1976d2',
  '#dc004e',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#d32f2f',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#5d4037',
  '#455a64',
  '#e91e63',
  '#4caf50',
  '#ff9800',
  '#673ab7',
];

const ICON_OPTIONS = [
  'home',
  'business',
  'location_on',
  'star',
  'favorite',
  'work',
  'school',
  'restaurant',
  'hotel',
  'store',
  'apartment',
  'villa',
  'house',
  'warehouse',
  'factory',
];

const CustomFilterManager: React.FC<CustomFilterManagerProps> = ({
  open,
  onClose,
  onSave,
  onDuplicate,
  onSetDefault,
  existingFilter,
  currentCriteria,
}) => {
  const [formData, setFormData] = useState<CustomFilterData>({
    name: '',
    description: '',
    criteria_json: currentCriteria || {},
    scope: 'private',
    color: '#1976d2',
    icon: 'filter_list',
    is_default: false,
    sort_order: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingFilter) {
      setFormData(existingFilter);
    } else if (currentCriteria) {
      setFormData(prev => ({
        ...prev,
        criteria_json: currentCriteria,
      }));
    }
  }, [existingFilter, currentCriteria]);

  const handleInputChange = (field: keyof CustomFilterData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (Object.keys(formData.criteria_json).length === 0) {
      setError('Adicione pelo menos um critério de filtro');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      handleClose();
    } catch (err) {
      setError('Erro ao salvar filtro');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = () => {
    if (existingFilter?.id && onDuplicate) {
      const newName = `${formData.name} (Cópia)`;
      onDuplicate(existingFilter.id, newName);
    }
  };

  const handleSetDefault = () => {
    if (existingFilter?.id && onSetDefault) {
      onSetDefault(existingFilter.id);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      criteria_json: {},
      scope: 'private',
      color: '#1976d2',
      icon: 'filter_list',
      is_default: false,
      sort_order: 0,
    });
    setError(null);
    onClose();
  };

  const getCriteriaSummary = (criteria: FilterCriteria): string => {
    const parts: string[] = [];

    if (criteria.q) parts.push(`Busca: "${criteria.q}"`);
    if (criteria.city?.length)
      parts.push(`Cidades: ${criteria.city.join(', ')}`);
    if (criteria.space_type?.length)
      parts.push(`Tipos: ${criteria.space_type.join(', ')}`);
    if (criteria.price_day) {
      const { min, max } = criteria.price_day;
      parts.push(`Preço: R$ ${min} - ${max || '∞'}`);
    }
    if (criteria.capacity) {
      const { min, max } = criteria.capacity;
      parts.push(`Capacidade: ${min} - ${max || '∞'} pessoas`);
    }

    return parts.join(' | ') || 'Filtro personalizado';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">
            {existingFilter ? 'Editar Filtro' : 'Criar Filtro Personalizado'}
          </Typography>
          <Box>
            {existingFilter && (
              <>
                <Tooltip title="Duplicar filtro">
                  <IconButton onClick={handleDuplicate} size="small">
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title={
                    existingFilter.is_default
                      ? 'Filtro padrão'
                      : 'Definir como padrão'
                  }
                >
                  <IconButton
                    onClick={handleSetDefault}
                    size="small"
                    color={existingFilter.is_default ? 'primary' : 'default'}
                  >
                    {existingFilter.is_default ? <Star /> : <StarBorder />}
                  </IconButton>
                </Tooltip>
              </>
            )}
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Informações básicas */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nome do Filtro"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Ex: Estúdios São Paulo"
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Escopo</InputLabel>
              <Select
                value={formData.scope}
                onChange={e => handleInputChange('scope', e.target.value)}
                label="Escopo"
              >
                {SCOPE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Descreva o que este filtro faz..."
              multiline
              rows={2}
            />
          </Grid>

          {/* Personalização visual */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Personalização Visual
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Cor
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {COLOR_OPTIONS.map(color => (
                <Box
                  key={color}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: color,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border:
                      formData.color === color
                        ? '3px solid #000'
                        : '1px solid #ccc',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                  onClick={() => handleInputChange('color', color)}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Ícone</InputLabel>
              <Select
                value={formData.icon}
                onChange={e => handleInputChange('icon', e.target.value)}
                label="Ícone"
              >
                {ICON_OPTIONS.map(icon => (
                  <MenuItem key={icon} value={icon}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterList />
                      <Typography variant="body2">{icon}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Configurações */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Configurações
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_default}
                  onChange={e =>
                    handleInputChange('is_default', e.target.checked)
                  }
                />
              }
              label="Filtro padrão"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Este filtro será aplicado automaticamente ao abrir a página de
              locações
            </Typography>
          </Grid>

          {/* Resumo dos critérios */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Resumo dos Critérios
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {getCriteriaSummary(formData.criteria_json)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
        >
          {existingFilter ? 'Atualizar' : 'Criar'} Filtro
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomFilterManager;

