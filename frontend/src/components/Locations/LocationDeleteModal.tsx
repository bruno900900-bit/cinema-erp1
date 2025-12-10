import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Delete, Warning, Cancel } from '@mui/icons-material';
import { Location } from '../../types/user';

interface LocationDeleteModalProps {
  open: boolean;
  location: Location | null;
  onClose: () => void;
  onConfirm: (location: Location) => Promise<void>;
}

export default function LocationDeleteModal({
  open,
  location,
  onClose,
  onConfirm,
}: LocationDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);
      await onConfirm(location);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir locação');
    } finally {
      setLoading(false);
    }
  };

  if (!location) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" component="h2">
            Confirmar Exclusão
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Tem certeza que deseja excluir a locação:
          </Typography>

          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300',
              mt: 2,
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              {location.title}
            </Typography>

            {(location.city || location.state) && (
              <Typography variant="body2" color="text.secondary">
                <strong>Cidade:</strong> {location.city}
                {location.state ? `, ${location.state}` : ''}
              </Typography>
            )}

            {location.status && (
              <Typography variant="body2" color="text.secondary">
                <strong>Status:</strong> {location.status}
              </Typography>
            )}
          </Box>
        </Box>

        <Alert severity="warning" icon={<Warning />}>
          <Typography variant="body2">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os
            dados e fotos da locação serão permanentemente removidos.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          startIcon={<Cancel />}
          sx={{ minWidth: 120 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Delete />
            )
          }
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
