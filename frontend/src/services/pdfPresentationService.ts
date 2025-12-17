import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PhotoAsset } from '../components/Photos/types';

export type PageLayoutType = 'single' | 'two' | 'grid4';

export interface PresentationPage {
  id: string;
  layout: PageLayoutType;
  photoIds: (string | number)[]; // references to assets
  title?: string;
  notes?: string;
}

export interface PresentationMeta {
  title?: string;
  author?: string;
  createdAt?: string;
}

interface BuildPdfOptions {
  photos: PhotoAsset[];
  pages: PresentationPage[];
  meta?: PresentationMeta;
  cover?: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    imageId?: string | number;
  };
  summary?: { enabled: boolean };
}

export async function buildPresentationPdf({
  photos,
  pages,
  meta,
  cover,
  summary,
}: BuildPdfOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const photoMap = new Map(photos.map(p => [String(p.id), p]));

  const pageMargin = 40;

  // COVER PAGE
  if (cover?.enabled) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const title = cover.title || meta?.title || 'Apresentação';
    page.drawText(title, {
      x: 60,
      y: height - 140,
      size: 34,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });
    if (cover.subtitle)
      page.drawText(cover.subtitle, {
        x: 60,
        y: height - 180,
        size: 18,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
    if (cover.imageId) {
      const asset = photoMap.get(String(cover.imageId));
      if (asset) {
        try {
          const resp = await fetch(asset.url);
          const bytes = new Uint8Array(await resp.arrayBuffer());
          const ext = asset.url.split('?')[0].split('.').pop()?.toLowerCase();
          let embedded;
          if (ext === 'png') embedded = await pdfDoc.embedPng(bytes);
          else embedded = await pdfDoc.embedJpg(bytes);
          const targetW = width - 120;
          const targetH = height / 2;
          const { width: iw, height: ih } = embedded.size();
          const ratio = Math.min(targetW / iw, targetH / ih);
          const drawW = iw * ratio;
          const drawH = ih * ratio;
          page.drawImage(embedded, {
            x: 60 + (targetW - drawW) / 2,
            y: height / 2 - drawH / 2,
            width: drawW,
            height: drawH,
          });
        } catch {}
      }
    }
    if (meta?.createdAt)
      page.drawText(new Date(meta.createdAt).toLocaleString(), {
        x: 60,
        y: 60,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
  }

  // SUMMARY / TOC
  if (summary?.enabled) {
    let tocPage = pdfDoc.addPage();
    const { width, height } = tocPage.getSize();
    tocPage.drawText('Sumário', {
      x: 50,
      y: height - 70,
      size: 26,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    let y = height - 110;
    // cover contributes 1 page if enabled; summary pages themselves come before content
    // so first content page number = (#cover?1:0) + (#summaryPages? computed later) + 1
    // We'll compute dynamically; maintain an offset count
    const coverCount = cover?.enabled ? 1 : 0;
    const provisionalSummaryCount = 1; // start with 1, adjust if we add more
    let currentSummaryPages = 1;
    const positions: { label: string; idx: number; pageNumber: number }[] = [];
    // We'll map after we know final summary page count, so first collect labels
    pages.forEach((p, idx) => {
      positions.push({
        label: p.title || `Página ${idx + 1}`,
        idx,
        pageNumber: 0,
      });
    });
    // Estimate how many summary pages needed based on line count
    const linesPerPage = Math.floor((height - 140) / 24); // approx
    const requiredSummaryPages = Math.max(
      1,
      Math.ceil(positions.length / linesPerPage)
    );
    currentSummaryPages = requiredSummaryPages;
    const firstContentNumber = coverCount + currentSummaryPages + 1; // page numbering is 1-based
    // Assign page numbers
    positions.forEach((pos, i) => {
      pos.pageNumber = firstContentNumber + i;
    });
    // Now print with pagination
    let lineIndex = 0;
    positions.forEach(pos => {
      if (lineIndex && lineIndex % linesPerPage === 0) {
        tocPage = pdfDoc.addPage();
        const size = tocPage.getSize();
        y = size.height - 70;
        tocPage.drawText('Sumário (cont.)', {
          x: 50,
          y,
          size: 20,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 40;
      }
      const line = pos.label;
      const leftX = 60;
      const rightX = width - 70;
      const sizeFont = 14;
      // draw label
      tocPage.drawText(line, {
        x: leftX,
        y,
        size: sizeFont,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      // draw dots
      const labelWidth = font.widthOfTextAtSize(line, sizeFont);
      const dotsStart = leftX + labelWidth + 6;
      if (dotsStart < rightX - 20) {
        const dotsWidth = rightX - 20 - dotsStart;
        const dotCount = Math.floor(dotsWidth / 3.5);
        tocPage.drawText('.'.repeat(dotCount), {
          x: dotsStart,
          y,
          size: sizeFont,
          font,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
      // draw page number right-aligned
      const numStr = String(pos.pageNumber);
      const numWidth = font.widthOfTextAtSize(numStr, sizeFont);
      tocPage.drawText(numStr, {
        x: rightX - numWidth,
        y,
        size: sizeFont,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 24;
      lineIndex++;
    });
  }

  for (const pageDef of pages) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Título principal da página
    if (pageDef.title) {
      page.drawText(pageDef.title, {
        x: pageMargin,
        y: height - pageMargin - 16,
        size: 18,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    // Área disponível abaixo do título
    const topOffset = pageDef.title ? 80 : 50;
    const contentHeight = height - topOffset - pageMargin;
    const contentWidth = width - pageMargin * 2;

    const selectedPhotos = pageDef.photoIds
      .map(id => photoMap.get(String(id)))
      .filter(Boolean) as PhotoAsset[];

    // Helper para desenhar uma imagem escalada
    const drawScaled = async (
      asset: PhotoAsset,
      targetX: number,
      targetY: number,
      targetW: number,
      targetH: number
    ) => {
      try {
        let resp = await fetch(asset.url);

        // If CORS fails, we might catch it in the catch block below.
        // But if it returns 200 and valid body, we proceed.
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);

        const bytes = new Uint8Array(await resp.arrayBuffer());
        // Simple extension detection
        const urlLower = asset.url.toLowerCase();
        let isPng = urlLower.endsWith('.png');

        // Try to guess from content-type if available
        const cType = resp.headers.get('content-type');
        if (cType && cType.includes('png')) isPng = true;
        else if (cType && (cType.includes('jpeg') || cType.includes('jpg')))
          isPng = false;

        let embedded;
        if (isPng) {
          try {
            embedded = await pdfDoc.embedPng(bytes);
          } catch (pngErr) {
            // Fallback: try jpg if png fails (mismatched extension/content)
            embedded = await pdfDoc.embedJpg(bytes);
          }
        } else {
          try {
            embedded = await pdfDoc.embedJpg(bytes);
          } catch (jpgErr) {
            // Fallback: try png
            embedded = await pdfDoc.embedPng(bytes);
          }
        }

        const { width: iw, height: ih } = embedded.size();
        const ratio = Math.min(targetW / iw, targetH / ih);
        const drawW = iw * ratio;
        const drawH = ih * ratio;
        const offsetX = targetX + (targetW - drawW) / 2;
        const offsetY = targetY + (targetH - drawH) / 2;
        page.drawImage(embedded, {
          x: offsetX,
          y: offsetY,
          width: drawW,
          height: drawH,
        });
        if (asset.caption) {
          page.drawText(asset.caption.substring(0, 80), {
            x: offsetX,
            y: offsetY - 14,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        }
      } catch (e) {
        console.warn(
          'Falha ao embutir imagem (pode ser CORS ou formato):',
          asset.url,
          e
        );
        // Draw separate placeholder to indicate missing image
        page.drawText('Imagem não disponível', {
          x: targetX + targetW / 2 - 50,
          y: targetY + targetH / 2,
          size: 12,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    };

    if (pageDef.layout === 'single') {
      if (selectedPhotos[0]) {
        // Full height minus margins
        const drawH = contentHeight - 20;
        const drawY = height - pageMargin - topOffset - drawH;
        await drawScaled(
          selectedPhotos[0],
          pageMargin,
          drawY,
          contentWidth,
          drawH
        );
      }
    } else if (pageDef.layout === 'two') {
      const halfH = (contentHeight - 10) / 2;
      if (selectedPhotos[0]) {
        // Top photo
        const drawY = height - pageMargin - topOffset - halfH;
        await drawScaled(
          selectedPhotos[0],
          pageMargin,
          drawY,
          contentWidth,
          halfH - 10
        );
      }
      if (selectedPhotos[1]) {
        // Bottom photo
        const drawY = height - pageMargin - topOffset - halfH * 2 - 10;
        await drawScaled(
          selectedPhotos[1],
          pageMargin,
          drawY,
          contentWidth,
          halfH - 10
        );
      }
    } else if (pageDef.layout === 'grid4') {
      const cellW = (contentWidth - 10) / 2;
      const cellH = (contentHeight - 10) / 2;
      // Ensure we process up to 4 photos
      for (let i = 0; i < 4; i++) {
        const asset = selectedPhotos[i];
        if (!asset) continue;
        const row = Math.floor(i / 2); // 0 or 1
        const col = i % 2; // 0 or 1
        const x = pageMargin + col * (cellW + 10);
        const y = pageMargin + topOffset + (1 - row) * (cellH + 10); // Fix Y coordinate for PDF-lib (bottom-up)

        // Wait... pageMargin is bottom-left relative in PDF-lib usually?
        // Checking previous code: y = height - pageMargin - ...
        // Re-calculating Y to be top-down visual logic
        // Original code: x = pageMargin + ..., y = pageMargin + row * ...
        // If Y is bottom-up, row 0 (top) should have higher Y.

        // Correct logic for Y (Top-Down visual, Bottom-Up coordinate):
        // Top Row (row 0): Y = height - pageMargin - topOffset - cellH
        // Bottom Row (row 1): Y = height - pageMargin - topOffset - cellH * 2 - 10

        const effectiveY =
          height - pageMargin - topOffset - (row + 1) * cellH - row * 10;

        await drawScaled(asset, x, effectiveY, cellW, cellH - 14);
      }
    }

    // Notas / Observações
    if (pageDef.notes) {
      page.drawText(pageDef.notes.substring(0, 300), {
        x: pageMargin,
        y: pageMargin / 2,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  // Metadados opcionais - não todos leitores usam, mas mantemos
  if (meta?.title) pdfDoc.setTitle(meta.title);
  if (meta?.author) pdfDoc.setAuthor(meta.author);
  if (meta?.createdAt) pdfDoc.setCreationDate(new Date(meta.createdAt));

  const pdfBytes = await pdfDoc.save();
  const copy = new Uint8Array(pdfBytes); // standard Uint8Array
  return new Blob([copy], { type: 'application/pdf' });
}
