import React from 'react';
import { TableRow, TableCell, Skeleton, Box, Avatar } from '@mui/material';

/**
 * Skeleton loader para linhas da tabela de usuários
 * Melhora percepção de performance durante carregamento
 */
export default function SkeletonUserRow() {
  return (
    <TableRow>
      {/* Usuário */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ mr: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton
              variant="text"
              width="60%"
              height={24}
              animation="wave"
              sx={{ mb: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Skeleton
              variant="text"
              width="40%"
              height={16}
              animation="wave"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
            />
          </Box>
        </Box>
      </TableCell>

      {/* Email */}
      <TableCell>
        <Skeleton
          variant="text"
          width="80%"
          height={20}
          animation="wave"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        />
      </TableCell>

      {/* Função */}
      <TableCell>
        <Skeleton
          variant="rounded"
          width={100}
          height={24}
          animation="wave"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        />
      </TableCell>

      {/* Status */}
      <TableCell>
        <Skeleton
          variant="rounded"
          width={80}
          height={24}
          animation="wave"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        />
      </TableCell>

      {/* Último Login */}
      <TableCell>
        <Skeleton
          variant="text"
          width="60%"
          height={20}
          animation="wave"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        />
      </TableCell>

      {/* Ações */}
      <TableCell align="right">
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          animation="wave"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', ml: 'auto' }}
        />
      </TableCell>
    </TableRow>
  );
}
