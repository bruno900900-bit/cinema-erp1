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
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close,
  Save,
  Settings,
  Folder,
  Person,
  Security,
  Notifications,
  Palette,
  Language,
  Schedule,
  AttachMoney,
  Description,
  Image,
  Add,
  Delete,
  Edit,
  ExpandMore,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Project, User } from '../../types/user';

interface ProjectSettings {
  // Configurações básicas
  name: string;
  description?: string;
  cover_photo_url?: string;

  // Configurações de visibilidade
  is_public: boolean;
  allow_external_access: boolean;

  // Configurações de responsáveis
  manager_id?: number;
  coordinator_id?: number;
  supervisor_id?: number;

  // Configurações de notificações
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;

  // Configurações de orçamento
  budget_currency: string;
  exchange_rate_usd?: number;
  exchange_rate_eur?: number;

  // Configurações de datas
  default_rental_duration_days: number;
  auto_extend_rental: boolean;

  // Configurações de etapas
  auto_create_default_stages: boolean;
  require_stage_approval: boolean;

  // Configurações de documentos
  require_contract: boolean;
  auto_generate_contract: boolean;

  // Configurações de pastas
  folder_structure: ProjectFolderStructure;

  // Configurações personalizadas
  custom_settings: Record<string, any>;
}

interface ProjectFolderStructure {
  locations: boolean;
  contracts: boolean;
  photos: boolean;
  documents: boolean;
  reports: boolean;
  custom_folders: string[];
}

interface ProjectSettingsManagerProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  users: User[];
  onSave: (settings: ProjectSettings) => Promise<void>;
}

const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'Real Brasileiro (R$)' },
  { value: 'USD', label: 'Dólar Americano ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Libra Esterlina (£)' },
];

const DEFAULT_FOLDER_STRUCTURE: ProjectFolderStructure = {
  locations: true,
  contracts: true,
  photos: true,
  documents: true,
  reports: true,
  custom_folders: [],
};

export default function ProjectSettingsManager({
  open,
  onClose,
  project,
  users,
  onSave,
}: ProjectSettingsManagerProps) {
  const [settings, setSettings] = useState<ProjectSettings>({
    name: '',
    description: '',
    cover_photo_url: '',
    is_public: false,
    allow_external_access: false,
    manager_id: undefined,
    coordinator_id: undefined,
    supervisor_id: undefined,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    budget_currency: 'BRL',
    exchange_rate_usd: undefined,
    exchange_rate_eur: undefined,
    default_rental_duration_days: 1,
    auto_extend_rental: false,
    auto_create_default_stages: true,
    require_stage_approval: false,
    require_contract: true,
    auto_generate_contract: false,
    folder_structure: DEFAULT_FOLDER_STRUCTURE,
    custom_settings: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('basic');

  useEffect(() => {
    if (open && project) {
      // Carregar configurações do projeto
      setSettings({
        name: project.title || '',
        description: project.description || '',
        cover_photo_url: project.cover_photo_url || '',
        is_public: false, // Será implementado quando o campo existir
        allow_external_access: false,
        manager_id: undefined,
        coordinator_id: undefined,
        supervisor_id: undefined,
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        budget_currency: 'BRL',
        exchange_rate_usd: undefined,
        exchange_rate_eur: undefined,
        default_rental_duration_days: 1,
        auto_extend_rental: false,
        auto_create_default_stages: true,
        require_stage_approval: false,
        require_contract: true,
        auto_generate_contract: false,
        folder_structure: DEFAULT_FOLDER_STRUCTURE,
        custom_settings: {},
      });
    }
  }, [open, project]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(settings);
      onClose();
    } catch (err) {
      setError('Erro ao salvar configurações do projeto');
      console.error('Erro ao salvar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof ProjectSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFolderStructureChange = (
    key: keyof ProjectFolderStructure,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      folder_structure: {
        ...prev.folder_structure,
        [key]: value,
      },
    }));
  };

  const addCustomFolder = () => {
    const folderName = prompt('Nome da pasta personalizada:');
    if (folderName && folderName.trim()) {
      setSettings(prev => ({
        ...prev,
        folder_structure: {
          ...prev.folder_structure,
          custom_folders: [
            ...prev.folder_structure.custom_folders,
            folderName.trim(),
          ],
        },
      }));
    }
  };

  const removeCustomFolder = (index: number) => {
    setSettings(prev => ({
      ...prev,
      folder_structure: {
        ...prev.folder_structure,
        custom_folders: prev.folder_structure.custom_folders.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const getExpandedIcon = (section: string) => {
    return expandedSection === section ? (
      <ExpandMore />
    ) : (
      <ExpandMore style={{ transform: 'rotate(-90deg)' }} />
    );
  };

  if (!project) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Settings />
            <Typography variant="h6">Configurações do Projeto</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {project.title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Configurações Básicas */}
        <Accordion
          expanded={expandedSection === 'basic'}
          onChange={() =>
            setExpandedSection(expandedSection === 'basic' ? '' : 'basic')
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('basic')}>
            <Typography variant="h6">
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informações Básicas
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Projeto"
                  value={settings.name}
                  onChange={e => handleSettingChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  value={settings.description}
                  onChange={e =>
                    handleSettingChange('description', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da Foto de Capa"
                  value={settings.cover_photo_url}
                  onChange={e =>
                    handleSettingChange('cover_photo_url', e.target.value)
                  }
                  InputProps={{
                    startAdornment: <Image sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Configurações de Responsáveis */}
        <Accordion
          expanded={expandedSection === 'responsibles'}
          onChange={() =>
            setExpandedSection(
              expandedSection === 'responsibles' ? '' : 'responsibles'
            )
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('responsibles')}>
            <Typography variant="h6">
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Responsáveis
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Gerente</InputLabel>
                  <Select
                    value={settings.manager_id || ''}
                    onChange={e =>
                      handleSettingChange(
                        'manager_id',
                        e.target.value || undefined
                      )
                    }
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Coordenador</InputLabel>
                  <Select
                    value={settings.coordinator_id || ''}
                    onChange={e =>
                      handleSettingChange(
                        'coordinator_id',
                        e.target.value || undefined
                      )
                    }
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Supervisor</InputLabel>
                  <Select
                    value={settings.supervisor_id || ''}
                    onChange={e =>
                      handleSettingChange(
                        'supervisor_id',
                        e.target.value || undefined
                      )
                    }
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Configurações de Visibilidade */}
        <Accordion
          expanded={expandedSection === 'visibility'}
          onChange={() =>
            setExpandedSection(
              expandedSection === 'visibility' ? '' : 'visibility'
            )
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('visibility')}>
            <Typography variant="h6">
              <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
              Visibilidade e Acesso
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.is_public}
                    onChange={e =>
                      handleSettingChange('is_public', e.target.checked)
                    }
                  />
                }
                label="Projeto Público"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allow_external_access}
                    onChange={e =>
                      handleSettingChange(
                        'allow_external_access',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Permitir Acesso Externo"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Configurações de Notificações */}
        <Accordion
          expanded={expandedSection === 'notifications'}
          onChange={() =>
            setExpandedSection(
              expandedSection === 'notifications' ? '' : 'notifications'
            )
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('notifications')}>
            <Typography variant="h6">
              <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
              Notificações
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email_notifications}
                    onChange={e =>
                      handleSettingChange(
                        'email_notifications',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Notificações por E-mail"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sms_notifications}
                    onChange={e =>
                      handleSettingChange('sms_notifications', e.target.checked)
                    }
                  />
                }
                label="Notificações por SMS"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.push_notifications}
                    onChange={e =>
                      handleSettingChange(
                        'push_notifications',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Notificações Push"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Configurações de Orçamento */}
        <Accordion
          expanded={expandedSection === 'budget'}
          onChange={() =>
            setExpandedSection(expandedSection === 'budget' ? '' : 'budget')
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('budget')}>
            <Typography variant="h6">
              <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
              Orçamento e Moedas
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Moeda Padrão</InputLabel>
                  <Select
                    value={settings.budget_currency}
                    onChange={e =>
                      handleSettingChange('budget_currency', e.target.value)
                    }
                  >
                    {CURRENCY_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Taxa USD"
                  type="number"
                  value={settings.exchange_rate_usd || ''}
                  onChange={e =>
                    handleSettingChange(
                      'exchange_rate_usd',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Taxa EUR"
                  type="number"
                  value={settings.exchange_rate_eur || ''}
                  onChange={e =>
                    handleSettingChange(
                      'exchange_rate_eur',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Configurações de Etapas */}
        <Accordion
          expanded={expandedSection === 'stages'}
          onChange={() =>
            setExpandedSection(expandedSection === 'stages' ? '' : 'stages')
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('stages')}>
            <Typography variant="h6">
              <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
              Etapas e Prazos
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duração Padrão de Locação (dias)"
                  type="number"
                  value={settings.default_rental_duration_days}
                  onChange={e =>
                    handleSettingChange(
                      'default_rental_duration_days',
                      parseInt(e.target.value) || 1
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.auto_extend_rental}
                      onChange={e =>
                        handleSettingChange(
                          'auto_extend_rental',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Estender Locação Automaticamente"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.auto_create_default_stages}
                      onChange={e =>
                        handleSettingChange(
                          'auto_create_default_stages',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Criar Etapas Padrão Automaticamente"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.require_stage_approval}
                      onChange={e =>
                        handleSettingChange(
                          'require_stage_approval',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Exigir Aprovação para Etapas"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Configurações de Pastas */}
        <Accordion
          expanded={expandedSection === 'folders'}
          onChange={() =>
            setExpandedSection(expandedSection === 'folders' ? '' : 'folders')
          }
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={getExpandedIcon('folders')}>
            <Typography variant="h6">
              <Folder sx={{ mr: 1, verticalAlign: 'middle' }} />
              Estrutura de Pastas
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Pastas Padrão
            </Typography>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.folder_structure.locations}
                    onChange={e =>
                      handleFolderStructureChange('locations', e.target.checked)
                    }
                  />
                }
                label="📁 Locações"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.folder_structure.contracts}
                    onChange={e =>
                      handleFolderStructureChange('contracts', e.target.checked)
                    }
                  />
                }
                label="📄 Contratos"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.folder_structure.photos}
                    onChange={e =>
                      handleFolderStructureChange('photos', e.target.checked)
                    }
                  />
                }
                label="🖼️ Fotos"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.folder_structure.documents}
                    onChange={e =>
                      handleFolderStructureChange('documents', e.target.checked)
                    }
                  />
                }
                label="📋 Documentos"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.folder_structure.reports}
                    onChange={e =>
                      handleFolderStructureChange('reports', e.target.checked)
                    }
                  />
                }
                label="📊 Relatórios"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Pastas Personalizadas
            </Typography>
            <List dense>
              {settings.folder_structure.custom_folders.map((folder, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Folder />
                  </ListItemIcon>
                  <ListItemText primary={folder} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeCustomFolder(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Button
              startIcon={<Add />}
              onClick={addCustomFolder}
              variant="outlined"
              size="small"
            >
              Adicionar Pasta
            </Button>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
        >
          Salvar Configurações
        </Button>
      </DialogActions>
    </Dialog>
  );
}









