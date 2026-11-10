import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Container } from '@mui/material';
import { Assignment, Create } from '@mui/icons-material';
import UserDemandsList from '../components/Demands/UserDemandsList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`demands-tabpanel-${index}`}
      aria-labelledby={`demands-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MyDemandsPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Minhas Demandas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Visualize e gerencie todas as demandas atribuídas a você
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="demand tabs"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab
            icon={<Assignment />}
            iconPosition="start"
            label="Atribuídas a Mim"
          />
          <Tab icon={<Create />} iconPosition="start" label="Criadas por Mim" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <UserDemandsList showCreatedDemands={false} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <UserDemandsList showCreatedDemands={true} />
        </TabPanel>
      </Paper>
    </Container>
  );
}
