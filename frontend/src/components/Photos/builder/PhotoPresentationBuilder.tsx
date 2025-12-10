import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Select,
  MenuItem,
  TextField,
  Paper,
  Avatar,
  IconButton,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { usePresentation } from './PresentationContext';
import {
  enrichPresentation,
  exportServerPresentation,
} from '../../../services/presentationEnrichmentService';
import { buildPresentationPdf } from '../../../services/pdfPresentationService';

export const PhotoPresentationBuilder: React.FC = () => {
  const {
    photos,
    pages,
    generatePagesFromOrder,
    setPageLayout,
    setPageTitle,
    setPageNotes,
    reorderPhotos,
    removePhoto,
    cover,
    summary,
    setCover,
    setSummary,
    replacePages,
    replacePhotos,
  } = usePresentation();
  const [globalLayout, setGlobalLayout] = useState<'single' | 'two' | 'grid4'>(
    'single'
  );
  const [docTitle, setDocTitle] = useState('Apresentação de Locações');
  const [generating, setGenerating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [serverExporting, setServerExporting] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [backupState, setBackupState] = useState<any | null>(null);

  const openSnack = (
    message: string,
    severity: 'success' | 'error' | 'info' = 'info'
  ) => setSnack({ open: true, message, severity });
  const handleEnrich = async () => {
    if (!photos.length) {
      openSnack('Adicione fotos antes de enriquecer', 'info');
      return;
    }
    setEnriching(true);
    try {
      // backup for undo
      setBackupState({
        cover: { ...cover },
        summary: { ...summary },
        pages: JSON.parse(JSON.stringify(pages)),
        photos: JSON.parse(JSON.stringify(photos)),
      });
      const payload = {
        cover,
        summary,
        pages: pages.map(p => ({ ...p, photoIds: p.photoIds })),
        photos,
      };
      const enriched: any = await enrichPresentation(payload, {
        executiveSummary: true,
      });
      if (enriched.cover) setCover({ ...enriched.cover });
      if (enriched.summary) setSummary({ ...enriched.summary });
      if (Array.isArray(enriched.pages)) {
        // map to PresentationPage shape
        const newPages = enriched.pages.map((p: any) => ({
          id: p.id,
          layout: p.layout,
          photoIds: p.photoIds || p.photoIds || [],
          title: p.title,
          notes: p.notes,
        }));
        replacePages(newPages);
      }
      if (Array.isArray(enriched.photos)) {
        replacePhotos(enriched.photos.map((p: any) => ({ ...p })));
      }
      openSnack(
        enriched?.meta?.ai_enriched
          ? 'Conteúdo enriquecido com IA'
          : 'IA desativada (sem chave)',
        'success'
      );
    } catch (e: any) {
      console.error(e);
      openSnack('Falha ao enriquecer', 'error');
    } finally {
      setEnriching(false);
    }
  };

  const handleUndoEnrich = () => {
    if (!backupState) return;
    setCover({ ...backupState.cover });
    setSummary({ ...backupState.summary });
    replacePages(backupState.pages);
    replacePhotos(backupState.photos);
    setBackupState(null);
    openSnack('Revertido', 'info');
  };

  const handleServerExport = async () => {
    setServerExporting(true);
    try {
      const payload = {
        cover,
        summary,
        pages: pages.map(p => ({ ...p, photoIds: p.photoIds })),
        photos,
      };
      const response: any = await exportServerPresentation(payload, false);
      if (response && response instanceof Blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(response);
        a.download = docTitle.replace(/\s+/g, '_') + '_server.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
        openSnack('PDF servidor gerado', 'success');
      } else if (
        response &&
        typeof response === 'object' &&
        response.status === 'html-fallback'
      ) {
        // show fallback HTML in new tab
        if ((response as any).html) {
          const w = window.open('', '_blank');
          if (w) {
            w.document.write((response as any).html);
            w.document.close();
          }
        }
        openSnack('Fallback HTML (Playwright não habilitado)', 'info');
      } else {
        openSnack('Resposta inesperada do servidor', 'error');
      }
    } catch (e) {
      console.error(e);
      openSnack('Falha export servidor', 'error');
    } finally {
      setServerExporting(false);
    }
  };

  const handleGenerateStructure = () => {
    generatePagesFromOrder(globalLayout);
  };

  const handleExport = async () => {
    setGenerating(true);
    try {
      const blob = await buildPresentationPdf({
        photos,
        pages,
        meta: { title: docTitle, createdAt: new Date().toISOString() },
        cover,
        summary,
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = docTitle.replace(/\s+/g, '_') + '.pdf';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('Erro ao gerar PDF', e);
    } finally {
      setGenerating(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    reorderPhotos(result.source.index, result.destination.index);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Apresentação
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="flex-start"
        sx={{ mb: 2 }}
      >
        <TextField
          label="Título do Documento"
          value={docTitle}
          onChange={e => setDocTitle(e.target.value)}
          fullWidth
          size="small"
        />
        <Select
          size="small"
          value={globalLayout}
          onChange={e => setGlobalLayout(e.target.value as any)}
        >
          <MenuItem value="single">1 foto / página</MenuItem>
          <MenuItem value="two">2 fotos / página</MenuItem>
          <MenuItem value="grid4">4 fotos / página</MenuItem>
        </Select>
        <Button
          variant="outlined"
          onClick={handleGenerateStructure}
          disabled={!photos.length}
        >
          Gerar Páginas
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleEnrich}
          disabled={enriching || !photos.length}
        >
          {enriching ? 'Enriquecendo...' : 'Melhorar (IA)'}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleUndoEnrich}
          disabled={!backupState}
        >
          Desfazer
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!pages.length || generating}
        >
          {generating ? 'Gerando...' : 'Exportar Local'}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleServerExport}
          disabled={!pages.length || serverExporting}
        >
          {serverExporting ? 'Exportando...' : 'Exportar Servidor'}
        </Button>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Opções de Capa & Sumário
        </Typography>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="flex-start"
        >
          <FormControlLabel
            control={
              <Switch
                checked={cover.enabled}
                onChange={e => setCover({ enabled: e.target.checked })}
              />
            }
            label="Incluir Capa"
          />
          {cover.enabled && (
            <>
              <TextField
                size="small"
                label="Título da Capa"
                value={cover.title}
                onChange={e => setCover({ title: e.target.value })}
              />
              <TextField
                size="small"
                label="Subtítulo"
                value={cover.subtitle || ''}
                onChange={e => setCover({ subtitle: e.target.value })}
              />
              <Select
                size="small"
                displayEmpty
                value={cover.imageId ? String(cover.imageId) : ''}
                onChange={e =>
                  setCover({ imageId: e.target.value || undefined })
                }
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">
                  <em>Sem imagem</em>
                </MenuItem>
                {photos.map(p => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.caption || p.id}
                  </MenuItem>
                ))}
              </Select>
            </>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={summary.enabled}
                onChange={e => setSummary({ enabled: e.target.checked })}
              />
            }
            label="Incluir Sumário"
          />
        </Stack>
      </Paper>
      <Divider sx={{ mb: 2 }} />

      {!!photos.length && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Ordem das Fotos (arraste para reordenar)
          </Typography>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="photo-order" direction="horizontal">
              {provided => (
                <Stack
                  direction="row"
                  spacing={1}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': { height: 6 },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'divider',
                      borderRadius: 3,
                    },
                  }}
                >
                  {photos.map((p, index) => (
                    <Draggable
                      draggableId={String(p.id)}
                      index={index}
                      key={p.id}
                    >
                      {(dragProvided, snapshot) => (
                        <Paper
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          sx={{
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: 92,
                            position: 'relative',
                            border: snapshot.isDragging
                              ? '1px solid'
                              : '1px solid transparent',
                            borderColor: 'primary.main',
                          }}
                        >
                          <IconButton
                            size="small"
                            {...dragProvided.dragHandleProps}
                            sx={{ cursor: 'grab', mb: 0.5 }}
                            aria-label="Arrastar"
                          >
                            <DragIndicatorIcon fontSize="small" />
                          </IconButton>
                          <Avatar
                            variant="rounded"
                            src={p.thumbUrl || p.url}
                            alt={p.caption}
                            sx={{ width: 64, height: 64, mb: 0.5 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ textAlign: 'center', maxWidth: '100%' }}
                            noWrap
                          >
                            {p.caption || p.id}
                          </Typography>
                          <IconButton
                            size="small"
                            aria-label="Remover"
                            onClick={() => removePhoto(p.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Stack>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      )}
      {!pages.length && (
        <Typography variant="body2" color="text.secondary">
          Adicione fotos via Lightbox e clique em "Gerar Páginas".
        </Typography>
      )}
      <Stack spacing={2}>
        {pages.map(p => (
          <Paper key={p.id} variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="flex-start"
            >
              <Select
                size="small"
                value={p.layout}
                onChange={e => setPageLayout(p.id, e.target.value as any)}
              >
                <MenuItem value="single">1 foto / pág</MenuItem>
                <MenuItem value="two">2 fotos / pág</MenuItem>
                <MenuItem value="grid4">4 fotos / pág</MenuItem>
              </Select>
              <TextField
                size="small"
                label="Título pág."
                value={p.title || ''}
                onChange={e => setPageTitle(p.id, e.target.value)}
              />
              <TextField
                size="small"
                label="Notas"
                value={p.notes || ''}
                onChange={e => setPageNotes(p.id, e.target.value)}
                fullWidth
              />
              <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
                Fotos: {p.photoIds.length}
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack(s => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhotoPresentationBuilder;
