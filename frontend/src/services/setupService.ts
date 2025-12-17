// Setup Service - Migrated to return static "complete" status
// No backend needed - setup is managed via Supabase directly

export interface SetupStatus {
  is_setup_complete: boolean;
  message?: string;
}

export const setupService = {
  async getSetupStatus(): Promise<SetupStatus> {
    // Setup is always complete when using Supabase
    return {
      is_setup_complete: true,
      message: 'Sistema configurado com Supabase',
    };
  },

  async initializeSystem(): Promise<{ message: string }> {
    // No initialization needed - Supabase handles everything
    return { message: 'Sistema já inicializado' };
  },
};

export default setupService;
