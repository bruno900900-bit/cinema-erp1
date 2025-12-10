/**
 * Configuração do cliente Supabase para o frontend
 * Fornece acesso ao banco de dados, autenticação e storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://rwpmtuohcvnciemtsjge.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM1NzYsImV4cCI6MjA4MDg4OTU3Nn0.Wpkkzef7vTKQGQ5CZX41-qXHoQu4r_r67lK-fmvWQV8';

// Criar cliente Supabase
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'cinema-erp-frontend',
      },
    },
  }
);

// Exportar URL e Key para uso em outros lugares se necessário
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Exportar como default também
export default supabase;
