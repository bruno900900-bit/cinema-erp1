import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import SupplierManager from '../components/Suppliers/SupplierManager';

const SuppliersPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <BusinessIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Fornecedores
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gerencie fornecedores e suas locações
            </Typography>
          </Box>
        </Box>

        <SupplierManager />
      </Box>
    </Container>
  );
};

export default SuppliersPage;
