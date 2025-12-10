import React, { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { supplierService, Supplier } from '../../services/supplierService';
import SupplierManager from './SupplierManager';

interface SupplierSelectorProps {
  value?: Supplier | null;
  onChange: (supplier: Supplier | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onChange,
  label = 'Fornecedor',
  required = false,
  disabled = false,
  error = false,
  helperText,
}) => {
  const [open, setOpen] = useState(false);

  // Buscar fornecedores ativos
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['activeSuppliers'],
    queryFn: () => supplierService.getActiveSuppliers(),
  });

  const handleSupplierSelect = (supplier: Supplier) => {
    onChange(supplier);
    setOpen(false);
  };

  return (
    <Box>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        options={suppliers || []}
        getOptionLabel={option => option.name}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        loading={isLoading}
        disabled={disabled}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <Box display="flex" alignItems="center" mr={1}>
                  <BusinessIcon sx={{ color: 'text.secondary' }} />
                </Box>
              ),
              endAdornment: (
                <Box display="flex" alignItems="center">
                  <Tooltip title="Gerenciar Fornecedores">
                    <IconButton
                      size="small"
                      onClick={() => setOpen(true)}
                      disabled={disabled}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  {params.InputProps.endAdornment}
                </Box>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="subtitle2">{option.name}</Typography>
              <Box display="flex" alignItems="center" mt={0.5}>
                {option.email && (
                  <Box display="flex" alignItems="center" mr={2}>
                    <EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                )}
                {option.phone && (
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {option.phone}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.name}
              icon={<BusinessIcon />}
            />
          ))
        }
        noOptionsText="Nenhum fornecedor encontrado"
        loadingText="Carregando fornecedores..."
      />

      {/* Dialog para gerenciar fornecedores */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Gerenciar Fornecedores</DialogTitle>
        <DialogContent>
          <SupplierManager
            onSupplierSelect={handleSupplierSelect}
            showSelectButton={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierSelector;
