import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Autocomplete,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Description as ContractIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import {
  contractService,
  ContractData,
  ContractTemplate,
  GeneratedContract,
} from '../../services/contractService';
import { Project, User, UserList } from '../../types/user';

interface ContractGenerationModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  suppliers: any[];
  users: User[] | UserList[];
}

const steps = [
  'Dados do Projeto',
  'Informações do Fornecedor',
  'Dados da Locação',
  'Termos e Condições',
  'Revisão e Geração',
];

// Helper para converter datas de forma segura (string ou Date)
const toInputDateSafe = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  // Se for string, tentar extrair a parte da data
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return '';
};

// Helper para criar Date de forma segura
const toDateSafe = (date: Date | string | null | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
};

export default function ContractGenerationModal({
  open,
  onClose,
  project,
  suppliers,
  users,
}: ContractGenerationModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>('rental_property');
  const [generatedContract, setGeneratedContract] =
    useState<GeneratedContract | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [contractData, setContractData] = useState<Partial<ContractData>>({
    project: project
      ? {
          id: project.id,
          title: project.title,
          description: project.description || '',
          start_date: project.start_date || new Date(),
          end_date: project.end_date || new Date(),
          budget: project.budget || 0,
          responsible_user:
            (users as any[]).find(
              u => String(u.id) === String(project.responsibleUserId)
            ) || (users[0] as unknown as User),
        }
      : undefined,
    contractor: {
      name: 'Sua Empresa',
      email: 'contato@suaempresa.com',
      phone: '(11) 99999-9999',
      address: 'Seu endereço completo',
      cnpj: '00.000.000/0001-00',
    },
    rental: {
      property_address: '',
      property_description: '',
      rental_period_start: new Date(),
      rental_period_end: new Date(),
      monthly_rent: 0,
      deposit: 0,
      utilities_included: false,
      additional_services: [],
      additional_costs: 0,
    },
    terms: {
      payment_terms: 'Pagamento mensal antecipado via PIX',
      late_payment_penalty: 100,
      early_termination_penalty: 1000,
      maintenance_responsibility:
        'Locador responsável por manutenções estruturais, locatário por danos causados',
      insurance_required: true,
      access_restrictions: [
        'Acesso apenas durante horário comercial',
        'Respeitar cronograma de produção',
      ],
      special_conditions: [
        'Permitir filmagens noturnas',
        'Acesso a áreas externas',
      ],
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: (data: ContractData) =>
      contractService.generateContractFromTemplate(data, selectedTemplate),
    onSuccess: contract => {
      setGeneratedContract(contract);
      setActiveStep(4);
    },
    onError: error => {
      console.error('Erro ao gerar contrato:', error);
    },
  });

  const exportPDFMutation = useMutation({
    mutationFn: (contract: GeneratedContract) =>
      contractService.exportToPDF(contract),
    onSuccess: pdfUrl => {
      // Simular download do PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${generatedContract?.title || 'contrato'}.pdf`;
      link.click();
    },
  });

  const saveContractMutation = useMutation({
    mutationFn: (contract: GeneratedContract) =>
      contractService.saveContract(contract),
    onSuccess: () => {
      console.log('Contrato salvo com sucesso!');
    },
  });

  const templates = contractService.getAvailableTemplates();

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleGenerateContract = () => {
    if (
      contractData.project &&
      contractData.supplier &&
      contractData.contractor &&
      contractData.rental &&
      contractData.terms
    ) {
      generateContractMutation.mutate(contractData as ContractData);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setGeneratedContract(null);
    setShowPreview(false);
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <BusinessIcon color="primary" />
              Dados do Projeto
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Título do Projeto"
                  value={contractData.project?.title || ''}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      project: { ...prev.project!, title: e.target.value },
                    }))
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descrição do Projeto"
                  value={contractData.project?.description || ''}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      project: {
                        ...prev.project!,
                        description: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Data de Início"
                  type="date"
                  value={toInputDateSafe(contractData.project?.start_date)}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      project: {
                        ...prev.project!,
                        start_date: new Date(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Data de Término"
                  type="date"
                  value={toInputDateSafe(contractData.project?.end_date)}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      project: {
                        ...prev.project!,
                        end_date: new Date(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Orçamento Total"
                  type="number"
                  value={contractData.project?.budget || 0}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      project: {
                        ...prev.project!,
                        budget: parseFloat(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsável pelo Projeto</InputLabel>
                  <Select
                    value={contractData.project?.responsible_user?.id || ''}
                    onChange={e => {
                      const user = (users as any[]).find(
                        u => u.id === e.target.value
                      );
                      setContractData(prev => ({
                        ...prev,
                        project: {
                          ...prev.project!,
                          responsible_user: user as User,
                        },
                      }));
                    }}
                    label="Responsável pelo Projeto"
                  >
                    {(users as any[]).map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PersonIcon color="primary" />
              Informações do Fornecedor (Locador)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Selecionar Fornecedor</InputLabel>
                  <Select
                    value={contractData.supplier?.id || ''}
                    onChange={e => {
                      const supplier = suppliers.find(
                        s => s.id === e.target.value
                      );
                      setContractData(prev => ({
                        ...prev,
                        supplier: supplier,
                      }));
                    }}
                    label="Selecionar Fornecedor"
                  >
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {contractData.supplier && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nome do Fornecedor"
                      value={contractData.supplier.name}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="CNPJ/CPF"
                      value={
                        contractData.supplier.cnpj ||
                        (contractData.supplier as any).cpf ||
                        ''
                      }
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="E-mail"
                      value={contractData.supplier.email}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Telefone"
                      value={contractData.supplier.phone}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Endereço"
                      value={contractData.supplier.address}
                      fullWidth
                      disabled
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <HomeIcon color="primary" />
              Dados da Locação
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Endereço do Imóvel"
                  value={contractData.rental?.property_address || ''}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental!,
                        property_address: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descrição do Imóvel"
                  value={contractData.rental?.property_description || ''}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental!,
                        property_description: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Início da Locação"
                  type="date"
                  value={toInputDateSafe(
                    contractData.rental?.rental_period_start
                  )}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental!,
                        rental_period_start: new Date(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fim da Locação"
                  type="date"
                  value={toInputDateSafe(
                    contractData.rental?.rental_period_end
                  )}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental!,
                        rental_period_end: new Date(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Aluguel Mensal"
                  type="number"
                  value={contractData.rental?.monthly_rent || 0}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental!,
                        monthly_rent: parseFloat(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Caução"
                  type="number"
                  value={contractData.rental?.deposit || 0}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental!,
                        deposit: parseFloat(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractData.rental?.utilities_included || false}
                      onChange={e =>
                        setContractData(prev => ({
                          ...prev,
                          rental: {
                            ...prev.rental!,
                            utilities_included: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label="Utilidades incluídas no aluguel"
                />
              </Grid>
              {!contractData.rental?.utilities_included && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Custo das Utilidades"
                    type="number"
                    value={(contractData.rental as any)?.utilities_cost || 0}
                    onChange={e =>
                      setContractData(prev => ({
                        ...prev,
                        rental: {
                          ...prev.rental!,
                          utilities_cost: parseFloat(e.target.value),
                        } as any,
                      }))
                    }
                    fullWidth
                    InputProps={{
                      startAdornment: <MoneyIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <SecurityIcon color="primary" />
              Termos e Condições
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Forma de Pagamento"
                  value={contractData.terms?.payment_terms || ''}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      terms: { ...prev.terms!, payment_terms: e.target.value },
                    }))
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Multa por Atraso (R$)"
                  type="number"
                  value={contractData.terms?.late_payment_penalty || 0}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      terms: {
                        ...prev.terms!,
                        late_payment_penalty: parseFloat(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Multa por Rescisão Antecipada (R$)"
                  type="number"
                  value={contractData.terms?.early_termination_penalty || 0}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      terms: {
                        ...prev.terms!,
                        early_termination_penalty: parseFloat(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Responsabilidade de Manutenção"
                  value={contractData.terms?.maintenance_responsibility || ''}
                  onChange={e =>
                    setContractData(prev => ({
                      ...prev,
                      terms: {
                        ...prev.terms!,
                        maintenance_responsibility: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractData.terms?.insurance_required || false}
                      onChange={e =>
                        setContractData(prev => ({
                          ...prev,
                          terms: {
                            ...prev.terms!,
                            insurance_required: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label="Seguro obrigatório"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <ContractIcon color="primary" />
              Revisão e Geração
            </Typography>

            {!generatedContract ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Gerando contrato com IA...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Isso pode levar alguns segundos
                </Typography>
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Contrato gerado com sucesso! Revise o conteúdo antes de
                  salvar.
                </Alert>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {generatedContract.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Gerado em:{' '}
                      {new Date(generatedContract.generated_at).toLocaleString(
                        'pt-BR'
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {generatedContract.status}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      startIcon={<PreviewIcon />}
                      onClick={() => setShowPreview(true)}
                    >
                      Visualizar Contrato
                    </Button>
                    <Button
                      startIcon={<DownloadIcon />}
                      onClick={() =>
                        exportPDFMutation.mutate(generatedContract)
                      }
                      disabled={exportPDFMutation.isPending}
                    >
                      {exportPDFMutation.isPending
                        ? 'Gerando PDF...'
                        : 'Exportar PDF'}
                    </Button>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={() =>
                        saveContractMutation.mutate(generatedContract)
                      }
                      disabled={saveContractMutation.isPending}
                      variant="contained"
                    >
                      {saveContractMutation.isPending
                        ? 'Salvando...'
                        : 'Salvar Contrato'}
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContractIcon color="primary" />
              <Typography variant="h6">Gerar Contrato por IA</Typography>
            </Box>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {activeStep === 0 && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Template de Contrato</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  label="Template de Contrato"
                >
                  {templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box>
                        <Typography variant="subtitle1">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {renderStepContent(activeStep)}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          {activeStep > 0 && <Button onClick={handleBack}>Voltar</Button>}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained">
              Próximo
            </Button>
          ) : (
            !generatedContract && (
              <Button
                onClick={handleGenerateContract}
                variant="contained"
                disabled={generateContractMutation.isPending}
                startIcon={
                  generateContractMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    <ContractIcon />
                  )
                }
              >
                {generateContractMutation.isPending
                  ? 'Gerando...'
                  : 'Gerar Contrato'}
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Preview do Contrato */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6">Preview do Contrato</Typography>
            <IconButton onClick={() => setShowPreview(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {generatedContract && (
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'grey.50',
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              {generatedContract.content}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
