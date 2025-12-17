export interface User {
  id: string; // Mudou para string para compatibilidade com Firebase
  full_name: string;
  name?: string; // Alias para full_name para compatibilidade
  email: string;
  role: UserRole;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  timezone: string;
  locale: string;
  department?: string;
  position?: string;
  employee_id?: string;
  hire_date?: string;
  can_create_projects?: boolean;
  can_manage_users?: boolean;
  can_view_financials?: boolean;
  can_export_data?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  preferences_json?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  permissions_summary?: string;
  last_login?: string;
  permissions_json?: Record<string, unknown>;
}

export interface UserList {
  id: number;
  email: string;
  full_name: string;
  custom_permissions?: Record<string, unknown>;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  created_at: string;
  last_login?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  COORDINATOR = 'coordinator',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  CLIENT = 'client',
  CONTRIBUTOR = 'contributor',
}

export interface Permissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageLocations: boolean;
  canManageContracts: boolean;
  canManageSuppliers: boolean;
  canViewFinancials: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
  canManageCalendar: boolean;
  canManageFiles: boolean;
  canCreateProjects: boolean;
  canEditAllProjects: boolean;
  canDeleteProjects: boolean;
  canApproveContracts: boolean;
}

export interface Location {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  status: LocationStatus;
  sector_types?: SectorType[]; // Array para múltiplos setores
  space_type: SpaceType;
  supplier_id?: number | null;
  price_day_cinema?: number;
  price_hour_cinema?: number;
  price_day_publicidade?: number;
  price_hour_publicidade?: number;
  currency: string;
  city?: string;
  state?: string;
  country: string;
  capacity?: number;
  area_size?: number;
  available_from?: string;
  available_to?: string;
  supplier_name?: string;
  supplier_phone?: string;
  supplier_email?: string;
  has_parking?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  has_bathroom?: boolean;
  has_kitchen?: boolean;
  has_air_conditioning?: boolean;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  project?: Project;
  photos?: LocationPhoto[];
  tags?: LocationTag[];
}

export enum LocationStatus {
  DRAFT = 'draft',
  PROSPECTING = 'prospecting',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ARCHIVED = 'archived',
}

export enum SectorType {
  CINEMA = 'cinema',
  PUBLICIDADE = 'publicidade',
}

export enum SpaceType {
  INDOOR = 'indoor',
  OUTDOOR = 'outdoor',
  STUDIO = 'studio',
  LOCATION = 'location',
  ROOM = 'room',
  AREA = 'area',
}

// AdvancedSearchParams moved to locationService.ts

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  rating?: number;
  is_active: boolean;
}

export interface Project {
  id: string;
  title: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  description?: string;
  budget: number;
  budget_spent: number;
  budget_remaining: number;
  status: ProjectStatus;
  start_date: Date;
  end_date: Date;
  responsibleUserId: string;
  cover_photo_url?: string; // URL da foto de capa do projeto
  locations: ProjectLocation[]; // Locações selecionadas para o projeto
  tasks?: ProjectTask[]; // Tarefas específicas do projeto
  tags?: LocationTag[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
}

export interface ProjectLocation {
  id: string;
  location_id: number;
  location: Location;
  rental_start: Date;
  rental_end: Date;
  rental_start_time?: Date;
  rental_end_time?: Date;
  daily_rate: number;
  hourly_rate?: number;
  total_cost: number;
  currency?: string;
  status: RentalStatus;
  completion_percentage?: number;
  duration_days?: number;
  is_active?: boolean;
  is_overdue?: boolean;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  responsible_user?: User;
  coordinator_user?: User;
  notes?: string;
  special_requirements?: string;
  equipment_needed?: string;
  contract_url?: string;
  attachments_json?: Record<string, any>;
  stages?: ProjectLocationStage[];
  // ===== DATAS DE PRODUÇÃO =====
  visit_date?: Date | string; // Visitação
  technical_visit_date?: Date | string; // Visita Técnica
  filming_start_date?: Date | string; // Início de Gravação
  filming_end_date?: Date | string; // Fim de Gravação
  delivery_date?: Date | string; // Entrega da Locação
  created_at?: string;
  updated_at?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  assigned_to?: string;
  due_date?: Date;
  completed_at?: Date;
  completed?: boolean; // Computed: true se completed_at existe
  notes?: string;
  priority?: string;
  parent_task_id?: string;
  project_id?: string;
  assigned_to_id?: string;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export enum RentalStatus {
  RESERVED = 'reserved',
  CONFIRMED = 'confirmed',
  IN_USE = 'in_use',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum LocationStageType {
  PROSPECCAO = 'prospeccao',
  VISITACAO = 'visitacao',
  AVALIACAO_TECNICA = 'avaliacao_tecnica',
  APROVACAO_CLIENTE = 'aprovacao_cliente',
  NEGOCIACAO = 'negociacao',
  CONTRATACAO = 'contratacao',
  PREPARACAO = 'preparacao',
  SETUP = 'setup',
  GRAVACAO = 'gravacao',
  DESMONTAGEM = 'desmontagem',
  ENTREGA = 'entrega',
}

export enum StageStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
  SKIPPED = 'skipped',
}

export interface ProjectLocationStage {
  id: number;
  project_location_id: number;
  stage_type: LocationStageType;
  title: string;
  description?: string;
  status: StageStatus;
  completion_percentage: number;
  planned_start_date?: Date;
  planned_end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  responsible_user?: User;
  coordinator_user?: User;
  weight: number;
  is_milestone: boolean;
  is_critical: boolean;
  is_overdue: boolean;
  is_delayed: boolean;
  notes?: string;
  attachments_json?: Record<string, any>;
  dependencies_json?: number[];

  // Audit trail - rastreamento de mudanças
  status_changed_at?: string;
  status_changed_by_user_id?: number;
  status_changed_by_user?: User;
  completion_changed_at?: string;
  completion_changed_by_user_id?: number;
  completion_changed_by_user?: User;

  created_at: string;
  updated_at: string;
}

export enum TaskType {
  PREPARATION = 'preparation',
  SETUP = 'setup',
  MONITORING = 'monitoring',
  CLEANUP = 'cleanup',
  INSPECTION = 'inspection',
  RETURN = 'return',
  RESEARCH = 'research',
  PREPRODUCTION = 'preproduction',
  FILMING = 'filming',
  DEVELOPMENT = 'development',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface LocationPhoto {
  id: number;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
  kind: TagKind;
  color: string;
}

export interface LocationTag {
  id: string; // Mudou de number para string para compatibilidade com Tag
  name: string;
  kind: TagKind;
  color: string;
}

export enum TagKind {
  FEATURE = 'feature',
  AMENITY = 'amenity',
  RESTRICTION = 'restriction',
  CATEGORY = 'category',
}

export interface Visit {
  id: string;
  title: string;
  description?: string;
  locationId: string;
  userId: string;
  location_id: string; // Compatibilidade com backend
  user_id: string; // Compatibilidade com backend
  scheduledDate: Date;
  scheduled_date: string;
  duration: number;
  endDate?: Date;
  status: VisitStatus;
  notes?: string;
  location?: Location;
  user?: User;
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface DashboardMetrics {
  total_locations: number;
  active_projects: number;
  scheduled_visits: number;
  total_budget: number;
  monthly_revenue: number;
  top_locations: Location[];
  recent_visits: Visit[];
}
