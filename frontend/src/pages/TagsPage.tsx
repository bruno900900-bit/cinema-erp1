import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Label as LabelIcon } from '@mui/icons-material';
import TagManager from '../components/Tags/TagManager';

const TagsPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <LabelIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Tags
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gerencie tags para organizar projetos e locações
            </Typography>
          </Box>
        </Box>

        <TagManager />
      </Box>
    </Container>
  );
};

export default TagsPage;
