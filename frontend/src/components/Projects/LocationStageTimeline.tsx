import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Fade,
} from '@mui/material';
import {
  Search,
  RemoveRedEye,
  Assignment,
  ThumbUp,
  Handshake,
  Description,
  Build,
  Settings,
  Videocam,
  Inventory,
  CheckCircle,
  Schedule,
  PlayArrow,
  Pause,
  Error,
  MoreVert,
  Person,
  Update,
} from '@mui/icons-material';
import {
  ProjectLocationStage,
  StageStatus,
  LocationStageType,
} from '../../types/user';

interface LocationStageTimelineProps {
  stages: ProjectLocationStage[];
  compact?: boolean;
  onStageClick?: (stage: ProjectLocationStage) => void;
  onStageStatusUpdate?: (stageId: number, newStatus: StageStatus) => void;
}

// Ícones para cada tipo de etapa
const stageIcons: Record<LocationStageType, React.ReactNode> = {
  [LocationStageType.PROSPECCAO]: <Search sx={{ fontSize: 20 }} />,
  [LocationStageType.VISITACAO]: <RemoveRedEye sx={{ fontSize: 20 }} />,
  [LocationStageType.AVALIACAO_TECNICA]: <Assignment sx={{ fontSize: 20 }} />,
  [LocationStageType.APROVACAO_CLIENTE]: <ThumbUp sx={{ fontSize: 20 }} />,
  [LocationStageType.NEGOCIACAO]: <Handshake sx={{ fontSize: 20 }} />,
  [LocationStageType.CONTRATACAO]: <Description sx={{ fontSize: 20 }} />,
  [LocationStageType.PREPARACAO]: <Build sx={{ fontSize: 20 }} />,
  [LocationStageType.SETUP]: <Settings sx={{ fontSize: 20 }} />,
  [LocationStageType.GRAVACAO]: <Videocam sx={{ fontSize: 20 }} />,
  [LocationStageType.DESMONTAGEM]: <Inventory sx={{ fontSize: 20 }} />,
  [LocationStageType.ENTREGA]: <CheckCircle sx={{ fontSize: 20 }} />,
};

// Labels para cada tipo de etapa
const stageLabels: Record<LocationStageType, string> = {
  [LocationStageType.PROSPECCAO]: 'Prospecção',
  [LocationStageType.VISITACAO]: 'Visitação',
  [LocationStageType.AVALIACAO_TECNICA]: 'Avaliação',
  [LocationStageType.APROVACAO_CLIENTE]: 'Aprovação',
  [LocationStageType.NEGOCIACAO]: 'Negociação',
  [LocationStageType.CONTRATACAO]: 'Contrato',
  [LocationStageType.PREPARACAO]: 'Preparação',
  [LocationStageType.SETUP]: 'Setup',
  [LocationStageType.GRAVACAO]: 'Gravação',
  [LocationStageType.DESMONTAGEM]: 'Desmontagem',
  [LocationStageType.ENTREGA]: 'Entrega',
};

// Cores para cada status
const statusColors: Record<
  StageStatus,
  { bg: string; border: string; text: string }
> = {
  [StageStatus.COMPLETED]: {
    bg: '#e8f5e9',
    border: '#4caf50',
    text: '#2e7d32',
  },
  [StageStatus.IN_PROGRESS]: {
    bg: '#e3f2fd',
    border: '#2196f3',
    text: '#1565c0',
  },
  [StageStatus.PENDING]: { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' },
  [StageStatus.ON_HOLD]: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  [StageStatus.CANCELLED]: {
    bg: '#ffebee',
    border: '#f44336',
    text: '#c62828',
  },
};

// Status labels em português
const statusLabels: Record<StageStatus, string> = {
  [StageStatus.COMPLETED]: 'Concluída',
  [StageStatus.IN_PROGRESS]: 'Em Andamento',
  [StageStatus.PENDING]: 'Pendente',
  [StageStatus.ON_HOLD]: 'Em Espera',
  [StageStatus.CANCELLED]: 'Cancelada',
};

// Ordem padrão das etapas
const stageOrder: LocationStageType[] = [
  LocationStageType.PROSPECCAO,
  LocationStageType.VISITACAO,
  LocationStageType.AVALIACAO_TECNICA,
  LocationStageType.APROVACAO_CLIENTE,
  LocationStageType.NEGOCIACAO,
  LocationStageType.CONTRATACAO,
  LocationStageType.PREPARACAO,
  LocationStageType.SETUP,
  LocationStageType.GRAVACAO,
  LocationStageType.DESMONTAGEM,
  LocationStageType.ENTREGA,
];

export default function LocationStageTimeline({
  stages,
  compact = false,
  onStageClick,
  onStageStatusUpdate,
}: LocationStageTimelineProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStage, setSelectedStage] =
    useState<ProjectLocationStage | null>(null);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    stage: ProjectLocationStage
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedStage(stage);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStage(null);
  };

  const handleStatusChange = (newStatus: StageStatus) => {
    if (selectedStage && onStageStatusUpdate) {
      onStageStatusUpdate(selectedStage.id, newStatus);
    }
    handleMenuClose();
  };

  // Ordenar stages pela ordem padrão
  const sortedStages = [...stages].sort((a, b) => {
    const indexA = stageOrder.indexOf(a.stage_type);
    const indexB = stageOrder.indexOf(b.stage_type);
    return indexA - indexB;
  });

  // Encontrar o índice da etapa atual (primeira não concluída)
  const currentStageIndex = sortedStages.findIndex(
    stage => stage.status === StageStatus.IN_PROGRESS
  );

  if (compact) {
    // Versão compacta: apenas indicadores de status
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          overflowX: 'auto',
          py: 1,
        }}
      >
        {sortedStages.map((stage, index) => {
          const colors = statusColors[stage.status];
          const isActive = stage.status === StageStatus.IN_PROGRESS;

          return (
            <React.Fragment key={stage.id}>
              <Tooltip
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {stageLabels[stage.stage_type] || stage.title}
                    </Typography>
                    <Typography variant="caption">
                      {statusLabels[stage.status]}
                    </Typography>
                    {stage.responsible_user && (
                      <Typography variant="caption" display="block">
                        Resp: {stage.responsible_user.full_name}
                      </Typography>
                    )}
                  </Box>
                }
                arrow
              >
                <Box
                  sx={{
                    width: isActive ? 32 : 24,
                    height: isActive ? 32 : 24,
                    borderRadius: '50%',
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isActive ? `0 0 8px ${colors.border}` : 'none',
                    '&:hover': {
                      transform: 'scale(1.2)',
                    },
                  }}
                  onClick={() => onStageClick?.(stage)}
                >
                  {stage.status === StageStatus.COMPLETED ? (
                    <CheckCircle sx={{ fontSize: 14, color: colors.text }} />
                  ) : stage.status === StageStatus.IN_PROGRESS ? (
                    <PlayArrow sx={{ fontSize: 14, color: colors.text }} />
                  ) : (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: colors.border,
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
              {index < sortedStages.length - 1 && (
                <Box
                  sx={{
                    width: 20,
                    height: 2,
                    backgroundColor:
                      sortedStages[index + 1]?.status ===
                        StageStatus.COMPLETED ||
                      sortedStages[index + 1]?.status ===
                        StageStatus.IN_PROGRESS
                        ? '#4caf50'
                        : '#e0e0e0',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    );
  }

  // Versão completa: timeline horizontal com detalhes
  return (
    <Box sx={{ py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 2,
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#bdbdbd',
            borderRadius: 3,
          },
        }}
      >
        {sortedStages.map((stage, index) => {
          const colors = statusColors[stage.status];
          const isActive = stage.status === StageStatus.IN_PROGRESS;
          const isHovered = hoveredStage === stage.id;

          return (
            <React.Fragment key={stage.id}>
              <Fade in timeout={300 + index * 100}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 120,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform:
                      isHovered || isActive
                        ? 'translateY(-4px)'
                        : 'translateY(0)',
                    pt: 2, // Espaço no topo para não cortar o botão
                    pb: 2, // Espaço embaixo para o histórico
                  }}
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => onStageClick?.(stage)}
                >
                  {/* Ícone da etapa */}
                  <Box
                    sx={{
                      width: isActive ? 56 : 48,
                      height: isActive ? 56 : 48,
                      borderRadius: '50%',
                      backgroundColor: colors.bg,
                      border: `3px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow:
                        isActive || isHovered
                          ? `0 4px 12px ${colors.border}40`
                          : 'none',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${colors.border}60`,
                      },
                    }}
                  >
                    <Box sx={{ color: colors.text }}>
                      {stageIcons[stage.stage_type]}
                    </Box>

                    {/* Indicador de status no canto */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        border: `2px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stage.status === StageStatus.COMPLETED && (
                        <CheckCircle sx={{ fontSize: 12, color: '#4caf50' }} />
                      )}
                      {stage.status === StageStatus.IN_PROGRESS && (
                        <PlayArrow sx={{ fontSize: 12, color: '#2196f3' }} />
                      )}
                      {stage.status === StageStatus.ON_HOLD && (
                        <Pause sx={{ fontSize: 12, color: '#ff9800' }} />
                      )}
                      {stage.status === StageStatus.CANCELLED && (
                        <Error sx={{ fontSize: 12, color: '#f44336' }} />
                      )}
                      {stage.status === StageStatus.PENDING && (
                        <Schedule sx={{ fontSize: 12, color: '#9e9e9e' }} />
                      )}
                    </Box>

                    {/* Menu de ações - SEMPRE VISÍVEL */}
                    {onStageStatusUpdate && (
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          width: 26,
                          height: 26,
                          backgroundColor: '#ffffff',
                          border: '2px solid',
                          borderColor: colors.border,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          opacity: 1, // Sempre visível
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: colors.bg,
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          },
                        }}
                        onClick={e => handleMenuOpen(e, stage)}
                      >
                        <MoreVert sx={{ fontSize: 16, color: colors.border }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Nome da etapa */}
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? colors.text : 'text.secondary',
                      maxWidth: 100,
                      lineHeight: 1.2,
                    }}
                  >
                    {stageLabels[stage.stage_type] || stage.title}
                  </Typography>

                  {/* Responsável */}
                  {stage.responsible_user && (
                    <Tooltip title={stage.responsible_user.full_name}>
                      <Avatar
                        src={stage.responsible_user.avatar_url}
                        sx={{
                          width: 24,
                          height: 24,
                          mt: 0.5,
                          border: `2px solid ${colors.border}`,
                        }}
                      >
                        {stage.responsible_user.full_name?.charAt(0)}
                      </Avatar>
                    </Tooltip>
                  )}

                  {/* Data e Nome de quem alterou - SEMPRE VISÍVEL */}
                  {stage.status_changed_by_user && stage.status_changed_at && (
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.25,
                        px: 1,
                        py: 0.5,
                        backgroundColor: colors.bg,
                        borderRadius: 1,
                        border: `1px solid ${colors.border}30`,
                        minWidth: 80,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Person sx={{ fontSize: 12, color: colors.text }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            color: colors.text,
                            textAlign: 'center',
                          }}
                        >
                          {
                            stage.status_changed_by_user.full_name?.split(
                              ' '
                            )[0]
                          }
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: 'text.secondary',
                          textAlign: 'center',
                        }}
                      >
                        {new Date(stage.status_changed_at).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          }
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Fade>

              {/* Linha de conexão */}
              {index < sortedStages.length - 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    mt: 3,
                    minWidth: 40,
                    height: 3,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      height: 3,
                      backgroundColor:
                        stage.status === StageStatus.COMPLETED
                          ? '#4caf50'
                          : '#e0e0e0',
                      borderRadius: 1.5,
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                  {/* Seta indicando direção */}
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft:
                        stage.status === StageStatus.COMPLETED
                          ? '8px solid #4caf50'
                          : '8px solid #e0e0e0',
                      transition: 'border-color 0.3s ease',
                    }}
                  />
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* Menu de contexto para mudar status */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem
          onClick={() => handleStatusChange(StageStatus.PENDING)}
          disabled={selectedStage?.status === StageStatus.PENDING}
        >
          <Schedule sx={{ mr: 1, color: '#9e9e9e' }} /> Pendente
        </MenuItem>
        <MenuItem
          onClick={() => handleStatusChange(StageStatus.IN_PROGRESS)}
          disabled={selectedStage?.status === StageStatus.IN_PROGRESS}
        >
          <PlayArrow sx={{ mr: 1, color: '#2196f3' }} /> Em Andamento
        </MenuItem>
        <MenuItem
          onClick={() => handleStatusChange(StageStatus.COMPLETED)}
          disabled={selectedStage?.status === StageStatus.COMPLETED}
        >
          <CheckCircle sx={{ mr: 1, color: '#4caf50' }} /> Concluída
        </MenuItem>
        <MenuItem
          onClick={() => handleStatusChange(StageStatus.ON_HOLD)}
          disabled={selectedStage?.status === StageStatus.ON_HOLD}
        >
          <Pause sx={{ mr: 1, color: '#ff9800' }} /> Em Espera
        </MenuItem>
      </Menu>
    </Box>
  );
}
