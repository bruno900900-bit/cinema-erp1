import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  CardMedia,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Assignment,
  CalendarToday,
  AttachMoney,
  Person,
  Event,
  LocationOn,
  Image as ImageIcon,
} from '@mui/icons-material';
import { Project, ProjectStatus, User, UserList } from '@/types/user';
import { formatDateBR } from '../../utils/date';

interface ProjectCardProps {
  project: Project;
  users: User[] | UserList[];
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onWorkflow: (project: Project) => void;
  onViewInAgenda: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  users,
  onView,
  onEdit,
  onDelete,
  onWorkflow,
  onViewInAgenda,
}) => {
  const getStatusColor = (status: ProjectStatus | string) => {
    switch (String(status)) {
      case 'PLANNING':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'ON_HOLD':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ProjectStatus | string) => {
    switch (String(status)) {
      case 'PLANNING':
        return 'Planejamento';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'COMPLETED':
        return 'Concluído';
      case 'ON_HOLD':
        return 'Em Pausa';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return String(status);
    }
  };

  const calculateProgress = () => {
    if (project.tasks && project.tasks.length > 0) {
      const completedTasks = project.tasks.filter(
        task => task.status === 'completed'
      ).length;
      return (completedTasks / project.tasks.length) * 100;
    }
    return 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: any) => formatDateBR(date);

  const getResponsibleUser = () => {
    return users.find(
      user => String(user.id) === String(project.responsibleUserId)
    );
  };

  const responsibleUser = getResponsibleUser();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {((project as any).cover_photo_url ||
        (project as any).coverPhotoUrl ||
        (project as any).image_url ||
        (project as any).imageUrl ||
        (project as any).cover?.url) && (
        <CardMedia
          component="img"
          height="140"
          image={
            (project as any).cover_photo_url ||
            (project as any).coverPhotoUrl ||
            (project as any).image_url ||
            (project as any).imageUrl ||
            (project as any).cover?.url
          }
          alt={project.title}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {project.title}
          </Typography>
          <Chip
            label={getStatusLabel(project.status)}
            color={getStatusColor(project.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Responsável:{' '}
              {(responsibleUser as any)?.full_name ||
                (responsibleUser as any)?.name ||
                (responsibleUser as any)?.email ||
                'Não definido'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarToday
              sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              Prazo: {formatDate(project.end_date)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AttachMoney
              sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              Orçamento: {formatCurrency(project.budget)}
            </Typography>
          </Box>

          {project.locations && project.locations.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn
                sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                Locações: {project.locations.length}
              </Typography>
            </Box>
          )}
        </Box>

        {project.tasks && project.tasks.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Progresso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(calculateProgress())}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={calculateProgress()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {project.tags && project.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {project.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag.name}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
            {project.tags.length > 3 && (
              <Chip
                label={`+${project.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Visualizar">
            <IconButton
              onClick={() => onView(project)}
              size="small"
              color="primary"
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              onClick={() => onEdit(project)}
              size="small"
              color="primary"
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Workflow">
            <IconButton
              onClick={() => onWorkflow(project)}
              size="small"
              color="secondary"
            >
              <Assignment />
            </IconButton>
          </Tooltip>

          <Tooltip title="Ver na Agenda">
            <IconButton
              onClick={() => onViewInAgenda(project)}
              size="small"
              color="info"
            >
              <Event />
            </IconButton>
          </Tooltip>

          <Tooltip title="Excluir">
            <IconButton
              onClick={() => onDelete(project)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {project.tasks?.length || 0} tarefas
          </Typography>
        </Box>
      </CardActions>
    </Card>
  );
};

export default ProjectCard;
