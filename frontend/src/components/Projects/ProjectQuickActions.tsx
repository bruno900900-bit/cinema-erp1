import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Description,
  Assignment,
  Email,
  Settings,
  BarChart,
  PictureAsPdf,
} from '@mui/icons-material';

interface ProjectQuickActionsProps {
  onGenerateReport: () => void;
  onViewTasks?: () => void;
  onSendEmail?: () => void;
  onSettings?: () => void;
  onExportPDF?: () => void;
}

const ProjectQuickActions: React.FC<ProjectQuickActionsProps> = ({
  onGenerateReport,
  onViewTasks,
  onSendEmail,
  onSettings,
  onExportPDF,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        background:
          'linear-gradient(135deg, rgba(33,150,243,0.05) 0%, rgba(156,39,176,0.05) 100%)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Tooltip title="Gerar Relatório" arrow>
        <IconButton
          onClick={onGenerateReport}
          sx={{
            bgcolor: 'background.paper',
            transition: 'all 0.3s',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
              transform: 'translateY(-2px)',
              boxShadow: 3,
            },
          }}
        >
          <Description />
        </IconButton>
      </Tooltip>

      {onViewTasks && (
        <Tooltip title="Ver Tarefas" arrow>
          <IconButton
            onClick={onViewTasks}
            sx={{
              bgcolor: 'background.paper',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'success.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <Assignment />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Analytics" arrow>
        <IconButton
          onClick={() => console.log('Analytics')}
          sx={{
            bgcolor: 'background.paper',
            transition: 'all 0.3s',
            '&:hover': {
              bgcolor: 'warning.main',
              color: 'white',
              transform: 'translateY(-2px)',
              boxShadow: 3,
            },
          }}
        >
          <BarChart />
        </IconButton>
      </Tooltip>

      {onSendEmail && (
        <Tooltip title="Enviar Email" arrow>
          <IconButton
            onClick={onSendEmail}
            sx={{
              bgcolor: 'background.paper',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'info.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <Email />
          </IconButton>
        </Tooltip>
      )}

      {onExportPDF && (
        <Tooltip title="Exportar PDF" arrow>
          <IconButton
            onClick={onExportPDF}
            sx={{
              bgcolor: 'background.paper',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      )}

      {onSettings && (
        <Tooltip title="Configurações" arrow>
          <IconButton
            onClick={onSettings}
            sx={{
              bgcolor: 'background.paper',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'grey.700',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ProjectQuickActions;
