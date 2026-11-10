import React from 'react';
import { Container } from '@mui/material';
import AdminPermissionsPanel from '../components/Admin/AdminPermissionsPanel';
import PermissionGuard from '../components/Common/PermissionGuard';

export default function AdminPage() {
  return (
    <PermissionGuard permission="canManageUsers">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <AdminPermissionsPanel />
      </Container>
    </PermissionGuard>
  );
}
