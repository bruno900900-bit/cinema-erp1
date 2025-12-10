import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Supplier } from '@/services/supplierService';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/user';

interface SupplierLocationLinkDialogProps {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onLinked?: () => void;
}

const SupplierLocationLinkDialog: React.FC<SupplierLocationLinkDialogProps> = ({
  open,
  supplier,
  onClose,
  onLinked,
}) => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier-location-link', supplier?.id],
    enabled: open && !!supplier,
    queryFn: () =>
      locationService.getLocations({
        page: 1,
        page_size: 200,
        include: ['supplier', 'photos', 'tags'],
      }),
  });

  // Memoize locations to prevent infinite loops
  const locations = useMemo(() => data?.locations ?? [], [data]);

  useEffect(() => {
    if (open && supplier && data?.locations) {
      const linkedIds = data.locations
        .filter(location => {
          const existingId = location.supplier_id ?? location.supplier?.id;
          return existingId === supplier.id;
        })
        .map(location => location.id);
      setSelectedIds(linkedIds);
    }
    if (!open) {
      setSelectedIds([]);
      setSearchTerm('');
    }
  }, [open, supplier, data]);

  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return locations;
    const term = searchTerm.toLowerCase();
    return locations.filter(location => {
      const combined = `${location.title} ${location.city || ''} ${
        location.state || ''
      }`.toLowerCase();
      return combined.includes(term);
    });
  }, [locations, searchTerm]);

  const assignmentMutation = useMutation({
    mutationFn: async (
      changes: Array<{ locationId: number; supplierId: number | null }>
    ) => {
      await Promise.all(
        changes.map(change =>
          locationService.updateLocation(change.locationId, {
            supplier_id: change.supplierId,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      if (supplier) {
        queryClient.invalidateQueries({
          queryKey: ['supplier-locations', supplier.id],
        });
      }
    },
  });

  const toggleLocation = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!supplier) {
      onClose();
      return;
    }

    const currentAssignments = new Set(
      locations
        .filter(location => {
          const existingId = location.supplier_id ?? location.supplier?.id;
          return existingId === supplier.id;
        })
        .map(location => location.id)
    );

    const selectedSet = new Set(selectedIds);

    const toLink = Array.from(selectedSet).filter(
      id => !currentAssignments.has(id)
    );
    const toUnlink = Array.from(currentAssignments).filter(
      id => !selectedSet.has(id)
    );

    if (!toLink.length && !toUnlink.length) {
      onClose();
      return;
    }

    try {
      await assignmentMutation.mutateAsync([
        ...toLink.map(id => ({ locationId: id, supplierId: supplier.id })),
        ...toUnlink.map(id => ({ locationId: id, supplierId: null })),
      ]);
      onLinked?.();
      onClose();
    } catch (mutationError) {
      console.error('Erro ao vincular fornecedor:', mutationError);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Vincular Fornecedor às Locações</DialogTitle>
      <DialogContent dividers>
        {!supplier ? (
          <Alert severity="info">Selecione um fornecedor para continuar.</Alert>
        ) : error ? (
          <Alert severity="error">
            Não foi possível carregar as locações. Tente novamente mais tarde.
          </Alert>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : locations.length === 0 ? (
          <Alert severity="info">
            Nenhuma locação disponível para vincular.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Buscar locações"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Marque as locações que devem ficar vinculadas ao fornecedor
              selecionado.
            </Typography>
            <List dense sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredLocations.map(location => {
                const checked = selectedIds.includes(location.id);
                return (
                  <ListItemButton
                    key={location.id}
                    onClick={() => toggleLocation(location.id)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        tabIndex={-1}
                        disableRipple
                        checked={checked}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={location.title}
                      secondary={
                        location.city || location.state
                          ? `${location.city || ''}${
                              location.city && location.state ? ' • ' : ''
                            }${location.state || ''}`
                          : undefined
                      }
                    />
                  </ListItemButton>
                );
              })}
              {filteredLocations.length === 0 && (
                <Box sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma locação encontrada para o termo informado.
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        )}
        {assignmentMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Não foi possível aplicar as alterações. Tente novamente.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={assignmentMutation.isPending || !supplier}
        >
          {assignmentMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierLocationLinkDialog;
