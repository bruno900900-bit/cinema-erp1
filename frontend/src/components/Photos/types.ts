export interface PhotoAsset {
  id: string | number;
  url: string;
  thumbUrl?: string;
  caption?: string;
  width?: number;
  height?: number;
  created_at?: string;
}

export type PhotoLayout = 'single' | 'two' | 'grid4';
