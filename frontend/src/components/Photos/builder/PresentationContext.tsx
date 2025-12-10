import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { PhotoAsset } from '../types';
import {
  PresentationPage,
  PageLayoutType,
} from '../../../services/pdfPresentationService';

interface PresentationState {
  photos: PhotoAsset[];
  pages: PresentationPage[];
  addPhoto: (photo: PhotoAsset) => void;
  removePhoto: (id: string | number) => void;
  reorderPhotos: (sourceIndex: number, destIndex: number) => void;
  setPageLayout: (pageId: string, layout: PageLayoutType) => void;
  generatePagesFromOrder: (layout: PageLayoutType) => void;
  setPageTitle: (pageId: string, title: string) => void;
  setPageNotes: (pageId: string, notes: string) => void;
  cover: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    imageId?: string | number;
  };
  summary: { enabled: boolean };
  setCover: (cover: Partial<PresentationState['cover']>) => void;
  setSummary: (summary: Partial<PresentationState['summary']>) => void;
  replacePages: (pages: PresentationPage[]) => void;
  replacePhotos: (photos: PhotoAsset[]) => void;
  updatePhotoCaption: (id: string | number, caption: string) => void;
  clear: () => void;
}

export const PresentationContext = createContext<PresentationState | undefined>(
  undefined
);

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx)
    throw new Error(
      'usePresentation deve ser usado dentro de PresentationProvider'
    );
  return ctx;
}

let idCounter = 0;
const newId = () => `pg_${++idCounter}`;

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [pages, setPages] = useState<PresentationPage[]>([]);
  const [cover, setCoverState] = useState<{
    enabled: boolean;
    title: string;
    subtitle?: string;
    imageId?: string | number;
  }>({ enabled: false, title: 'Apresentação' });
  const [summary, setSummaryState] = useState<{ enabled: boolean }>({
    enabled: false,
  });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('presentation_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.photos)) setPhotos(parsed.photos);
        if (Array.isArray(parsed.pages)) setPages(parsed.pages);
        if (parsed.cover)
          setCoverState({
            enabled: !!parsed.cover.enabled,
            title: parsed.cover.title || 'Apresentação',
            subtitle: parsed.cover.subtitle,
            imageId: parsed.cover.imageId,
          });
        if (parsed.summary)
          setSummaryState({ enabled: !!parsed.summary.enabled });
      }
    } catch {}
  }, []);

  // Persist debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          'presentation_state_v1',
          JSON.stringify({ photos, pages, cover, summary })
        );
      } catch {}
    }, 250);
    return () => clearTimeout(handle);
  }, [photos, pages, cover, summary]);

  const addPhoto = (photo: PhotoAsset) => {
    setPhotos(prev =>
      prev.find(p => p.id === photo.id) ? prev : [...prev, photo]
    );
  };
  const removePhoto = (id: string | number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };
  const reorderPhotos = (source: number, dest: number) => {
    setPhotos(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(source, 1);
      arr.splice(dest, 0, moved);
      return arr;
    });
  };
  const generatePagesFromOrder = (layout: PageLayoutType) => {
    const groupSize = layout === 'single' ? 1 : layout === 'two' ? 2 : 4;
    const newPages: PresentationPage[] = [];

    // Group photos based on layout
    for (let i = 0; i < photos.length; i += groupSize) {
      const pagePhotos = photos.slice(i, i + groupSize);
      newPages.push({
        id: newId(),
        layout,
        photoIds: pagePhotos.map(p => p.id),
        title: '', // Optional default title
      });
    }

    setPages(newPages);
  };
  const setPageLayout = (pageId: string, layout: PageLayoutType) => {
    setPages(prev => prev.map(p => (p.id === pageId ? { ...p, layout } : p)));
  };
  const setPageTitle = (pageId: string, title: string) => {
    setPages(prev => prev.map(p => (p.id === pageId ? { ...p, title } : p)));
  };
  const setPageNotes = (pageId: string, notes: string) => {
    setPages(prev => prev.map(p => (p.id === pageId ? { ...p, notes } : p)));
  };
  const clear = () => {
    setPhotos([]);
    setPages([]);
    setCoverState({ enabled: false, title: 'Apresentação' });
    setSummaryState({ enabled: false });
    try {
      localStorage.removeItem('presentation_state_v1');
    } catch {}
  };

  const setCover = (partial: Partial<PresentationState['cover']>) => {
    setCoverState(prev => ({ ...prev, ...partial }));
  };
  const setSummary = (partial: Partial<PresentationState['summary']>) => {
    setSummaryState(prev => ({ ...prev, ...partial }));
  };

  const replacePages = (newPages: PresentationPage[]) => setPages(newPages);
  const replacePhotos = (newPhotos: PhotoAsset[]) => setPhotos(newPhotos);
  const updatePhotoCaption = (id: string | number, caption: string) => {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, caption } : p)));
  };

  return (
    <PresentationContext.Provider
      value={{
        photos,
        pages,
        addPhoto,
        removePhoto,
        reorderPhotos,
        setPageLayout,
        generatePagesFromOrder,
        setPageTitle,
        setPageNotes,
        cover,
        summary,
        setCover,
        setSummary,
        replacePages,
        replacePhotos,
        updatePhotoCaption,
        clear,
      }}
    >
      {children}
    </PresentationContext.Provider>
  );
}
