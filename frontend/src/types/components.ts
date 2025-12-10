import { ChangeEvent } from 'react';
import { Location, Tag } from './user';

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface PaginationProps {
  from: number;
  to: number;
  count: number;
}

export interface TagFormData {
  name: string;
  kind: string;
  color: string;
}

export interface LocationSearchParams {
  page: number;
  page_size: number;
  include: string[];
  q?: string;
}

export interface TableChangeEvent {
  target: {
    value: string;
  };
}
