/**
 * @deprecated LEGACY API CLIENT - No longer used by primary services
 *
 * This axios-based API service was created for the original backend API.
 * All CRUD operations have been migrated to use direct Supabase client.
 *
 * Migrated services (now use supabaseClient.ts directly):
 * - locationService, projectService, userService, tagService
 * - supplierService, projectLocationService, visitService
 * - authService, dashboardService
 *
 * This file is kept for backwards compatibility with any imports that
 * may still use normalizeListResponse() or the apiService singleton.
 * Consider removing this file if no longer needed.
 */
/// <reference types="vite/client" />
import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from 'axios';

class ApiService {
  private api: AxiosInstance;
  private isApiAvailable: boolean = true;

  constructor() {
    // Always use the direct Cloud Run URL in production to avoid Firebase rewrite issues
    const baseURLFromEnv = import.meta.env.VITE_API_BASE_URL;
    const sanitizedEnvBaseURL = baseURLFromEnv
      ? baseURLFromEnv.replace(/\/$/, '')
      : undefined;

    const computedBaseURL = sanitizedEnvBaseURL
      ? sanitizedEnvBaseURL
      : typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000/api/v1'
      : 'https://cinema-backend-140199679738.us-central1.run.app/api/v1';

    console.log('🛠️ API base URL resolvido:', computedBaseURL);

    this.api = axios.create({
      baseURL: computedBaseURL,
      timeout: 15000, // aumentar timeout para lidar com cold start do Cloud Run
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.setupInterceptors();

    // Adapter wrapper (última barreira) para garantir https e logar origem de qualquer http
    try {
      const existingAdapter: any = (this.api.defaults as any).adapter;
      if (existingAdapter) {
        const resolveAdapter = (adapterVal: any) => {
          if (typeof adapterVal === 'function') return adapterVal;
          if (Array.isArray(adapterVal))
            return adapterVal.find(a => typeof a === 'function');
          return undefined;
        };
        const originalResolved = resolveAdapter(existingAdapter);
        if (originalResolved) {
          (this.api.defaults as any).adapter = async (
            config: AxiosRequestConfig
          ) => {
            try {
              if (
                config.baseURL &&
                /http:\/\/cinema-erp-api-/i.test(config.baseURL)
              ) {
                console.warn(
                  '⚠️ Adapter: baseURL com http detectado antes do envio',
                  {
                    baseURL: config.baseURL,
                    stack: new Error().stack
                      ?.split('\n')
                      .slice(0, 6)
                      .join('\n'),
                  }
                );
                config.baseURL = config.baseURL.replace('http://', 'https://');
              }
              if (
                typeof config.url === 'string' &&
                /http:\/\/cinema-erp-api-/i.test(config.url)
              ) {
                console.warn(
                  '⚠️ Adapter: url com http detectada antes do envio',
                  {
                    url: config.url,
                    stack: new Error().stack
                      ?.split('\n')
                      .slice(0, 6)
                      .join('\n'),
                  }
                );
                config.url = config.url.replace('http://', 'https://');
              }
            } catch {}
            return originalResolved(config);
          };
        } else {
          console.warn(
            '⚠️ Adapter: não foi possível resolver adapter original; mantendo sem wrapper'
          );
        }
      }
    } catch (e) {
      console.warn('⚠️ Adapter wrapper falhou, ignorando', e);
    }
  }

  private setupInterceptors() {
    // Helpers to transform camelCase -> snake_case for API payloads
    const toSnake = (str: string) =>
      str
        .replace(/([A-Z])/g, '_$1')
        .replace(/-/g, '_')
        .toLowerCase();

    const isPlainObject = (val: any) =>
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof Date) &&
      !(val instanceof File) &&
      !(val instanceof Blob) &&
      !(val instanceof FormData);

    const keysToSnake = (input: any): any => {
      if (Array.isArray(input)) return input.map(keysToSnake);
      if (!isPlainObject(input)) return input;
      const out: any = {};
      for (const [k, v] of Object.entries(input)) {
        out[toSnake(k)] = keysToSnake(v as any);
      }
      return out;
    };

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      config => {
        const isBrowser = typeof window !== 'undefined';
        const isHttpsPage = isBrowser && window.location.protocol === 'https:';
        const onHosting =
          isBrowser &&
          /\.(web\.app|firebaseapp\.com)$/i.test(window.location.hostname);

        const apiKey = import.meta.env.VITE_API_KEY;
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }

        // Enforce HTTPS and Hosting-relative base to avoid mixed content
        if (isHttpsPage) {
          const before = { baseURL: config.baseURL, url: config.url };
          const upgrade = (val?: string) => {
            if (!val) return val;
            if (/^http:\/\//i.test(val))
              return val.replace(/^http:\/\//i, 'https://');
            return val;
          };
          const hardUpgradeApi = (val?: string) => {
            if (!val) return val;
            if (/http:\/\/cinema-erp-api-/i.test(val))
              return val.replace('http://', 'https://');
            return val;
          };
          config.baseURL =
            hardUpgradeApi(
              upgrade(
                typeof config.baseURL === 'string' ? config.baseURL : undefined
              )
            ) || config.baseURL;
          // url pode ser absoluta ou relativa; só aplicar upgrade em absolutas http
          if (typeof config.url === 'string') {
            const absolutePattern =
              /^http:\/\//i.test(config.url) ||
              /http:\/\/cinema-erp-api-/i.test(config.url);
            if (absolutePattern) {
              config.url = hardUpgradeApi(upgrade(config.url));
            }
          }
          if (before.baseURL !== config.baseURL || before.url !== config.url) {
            console.warn('🔐 HTTPS upgrade aplicado', {
              before,
              after: { baseURL: config.baseURL, url: config.url },
            });
          }
        }

        // Always use direct Cloud Run URL - no Firebase rewrites
        // This ensures we never get HTML responses from Firebase Hosting

        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Transformar payloads e params para snake_case (compatível com backend)
        try {
          const contentType = (config.headers['Content-Type'] ||
            config.headers['content-type']) as string | undefined;
          const isJson =
            !contentType || contentType.includes('application/json');

          // Log especial para FormData
          if (config.data instanceof FormData) {
            console.log(
              '🔍 Interceptor: FormData detected, skipping conversion'
            );
            // Garantir que Content-Type não está setado (deixar browser definir)
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
          } else if (config.data && isJson) {
            config.data = keysToSnake(config.data);
          }

          if (config.params && isPlainObject(config.params)) {
            config.params = keysToSnake(config.params);
          }
        } catch (e) {
          console.warn(
            'Não foi possível converter payload para snake_case:',
            e
          );
        }

        // Normalize collection endpoints to include trailing slash (antes de query string)
        try {
          const ensureSlash = (u?: string) => {
            if (!u) return u;
            // Separar query se existir
            const [pathPart, queryPart] = u.split('?');
            let newPath = pathPart;
            if (/^\/[a-z0-9\-]+$/i.test(pathPart)) {
              if (!pathPart.endsWith('/')) newPath = pathPart + '/';
            }
            return queryPart !== undefined
              ? `${newPath}?${queryPart}`
              : newPath;
          };

          if (typeof config.url === 'string') {
            config.url = ensureSlash(config.url);
          }
        } catch {}

        // Log da requisição para debug
        /* console.log(
          `🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
            config.url
          }`,
          {
            fullURL: `${config.baseURL}${config.url}`,
            params: config.params,
            data: config.data,
            headers: config.headers,
          }
        ); */

        // Segurança extra: se por qualquer motivo o fullURL ainda tiver http:// para nosso domínio API, atualizar
        try {
          const full = `${config.baseURL || ''}${config.url || ''}`;
          if (/http:\/\/cinema-erp-api-/i.test(full)) {
            if (typeof config.baseURL === 'string') {
              config.baseURL = config.baseURL.replace('http://', 'https://');
            }
            if (typeof config.url === 'string') {
              config.url = config.url.replace('http://', 'https://');
            }
          }
        } catch {}

        return config;
      },
      error => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para tratamento de respostas
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        this.isApiAvailable = true;
        try {
          const finalUrl =
            (response.request &&
              (response.request.responseURL || response.request.url)) ||
            '(sem responseURL)';
          const contentType =
            (response.headers &&
              (response.headers['content-type'] ||
                (response.headers as any)['Content-Type'])) ||
            'desconhecido';
          const rawIsString = typeof response.data === 'string';
          const snippet = rawIsString ? response.data.substring(0, 250) : '';
          const looksLikeHtml = rawIsString && /<!DOCTYPE html>/i.test(snippet);
          const looksLikeJsonText = rawIsString && /^[\s]*[\[{]/.test(snippet);

          /* console.log('🧪 API Debug Response', {
            method: response.config.method?.toUpperCase(),
            requested: `${response.config.baseURL}${response.config.url}`,
            finalUrl,
            status: response.status,
            contentType,
            isString: rawIsString,
            inferred: looksLikeHtml
              ? 'html'
              : looksLikeJsonText
              ? 'json-text'
              : rawIsString
              ? 'string-unknown'
              : 'json-object',
            snippet,
          }); */

          if (looksLikeHtml) {
            const redirectSuspect =
              finalUrl && !finalUrl.startsWith('https://cinema-erp-api-');
            console.error(
              '⚠️ API returned HTML instead of JSON (diagnóstico avançado)',
              {
                url: response.config.url,
                method: response.config.method?.toUpperCase(),
                finalUrl,
                status: response.status,
                contentType,
                redirectSuspect,
                dataPreview: snippet + '...',
              }
            );
            throw new Error(
              'API returned HTML instead of JSON - verifique redirecionamentos, service worker ou proxy'
            );
          }

          // ==== Normalização de URLs de fotos (relative -> absolute) ====
          const baseApi = (response.config.baseURL || '').replace(
            /\/?api\/?v1\/?$/i,
            ''
          );
          const absolutize = (u?: string): string | undefined => {
            if (!u) return u;
            if (/^https?:\/\//i.test(u)) return u;
            return `${baseApi}${u.startsWith('/') ? u : '/' + u}`;
          };
          const normalizePhoto = (p: any) => {
            if (p && typeof p === 'object') {
              if (p.url) p.url = absolutize(p.url);
              if (p.thumbnail_url)
                p.thumbnail_url = absolutize(p.thumbnail_url);
            }
          };
          const walk = (obj: any) => {
            if (!obj) return;
            if (Array.isArray(obj)) {
              obj.forEach(walk);
              return;
            }
            if (typeof obj !== 'object') return;

            if (obj.photos && Array.isArray(obj.photos)) {
              obj.photos.forEach(normalizePhoto);
            }
            // Alguns endpoints retornam lista de locações
            if (obj.locations && Array.isArray(obj.locations)) {
              obj.locations.forEach((loc: any) => {
                if (loc && Array.isArray(loc.photos))
                  loc.photos.forEach(normalizePhoto);
              });
            }
            // Normalizar cover_photo_url se existir
            if (obj.cover_photo_url)
              obj.cover_photo_url = absolutize(obj.cover_photo_url);

            // Walk shallow para objetos aninhados comuns
            Object.values(obj).forEach(val => {
              if (val && typeof val === 'object') walk(val);
            });
          };

          try {
            const data = response.data;
            walk(data);
          } catch {}
          // ==== fim normalização ====

          console.log(
            `✅ API Response: ${response.config.method?.toUpperCase()} ${
              response.config.url
            }`,
            {
              status: response.status,
              dataSample: rawIsString
                ? snippet.substring(0, 120)
                : response.data,
            }
          );
        } catch (inner) {
          // Silenciar para não quebrar fluxo adicional, erro real será lançado acima
        }

        return response;
      },
      (error: AxiosError) => {
        // Log detalhado do erro
        console.error(
          `❌ API Error: ${error.config?.method?.toUpperCase()} ${
            error.config?.url
          }`,
          {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            code: error.code,
          }
        );

        // Detectar se a API não está disponível
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ERR_NETWORK' ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('Network Error')
        ) {
          this.isApiAvailable = false;
          console.warn('🔧 API não disponível, usando dados mock');
          const enhancedError = new Error(
            'Servidor não disponível. Usando dados locais.'
          );
          enhancedError.name = 'NetworkError';
          return Promise.reject(enhancedError);
        }

        if (error.response?.status === 401) {
          // Token expirado ou inválido
          console.warn(
            '🔑 Token inválido ou expirado, redirecionando para login'
          );
          localStorage.removeItem('auth_token');
          localStorage.removeItem('is_authenticated');
          localStorage.removeItem('current_user');
          window.location.href = '/login';
        }

        // Melhorar mensagens de erro para o React Query
        if (error.response?.status === 422) {
          const errorData: any = error.response?.data as any;
          let errorMessage = 'Dados inválidos fornecidos';

          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.detail) {
            // FastAPI validation errors - LOG COMPLETO
            console.error(
              '📝 Validation Error Detail (FULL):',
              JSON.stringify(errorData.detail, null, 2)
            );

            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail
                .map((err: any) => {
                  const field = err.loc ? err.loc.join('.') : 'unknown';
                  const msg = err.msg || err.message || 'validation error';
                  return `${field}: ${msg}`;
                })
                .join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }

          console.error('📝 Validation Error:', errorData);
          console.error('📝 Error Message:', errorMessage);
          const enhancedError = new Error(errorMessage);
          enhancedError.name = 'ValidationError';
          return Promise.reject(enhancedError);
        }

        if (error.response?.status === 500) {
          console.error('🔥 Server Error:', error.response.data);
          const enhancedError = new Error(
            'Erro interno do servidor. Tente novamente mais tarde.'
          );
          enhancedError.name = 'ServerError';
          return Promise.reject(enhancedError);
        }

        if (error.response?.status === 404) {
          console.warn('🔍 Resource not found:', error.config?.url);
          const enhancedError = new Error('Recurso não encontrado');
          enhancedError.name = 'NotFoundError';
          return Promise.reject(enhancedError);
        }

        if (error.response?.status === 403) {
          console.warn('🚫 Forbidden access:', error.config?.url);
          const enhancedError = new Error('Acesso negado');
          enhancedError.name = 'ForbiddenError';
          return Promise.reject(enhancedError);
        }

        // Para outros erros, manter o erro original mas com log
        console.error('❓ Unexpected error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Métodos HTTP genéricos
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const maxRetries = 2;
    let attempt = 0;
    while (true) {
      try {
        const response = await this.api.get<T>(url, config);
        return response.data;
      } catch (err: any) {
        const retriable =
          err?.code === 'ECONNABORTED' ||
          err?.code === 'ERR_NETWORK' ||
          /timeout/i.test(err?.message || '');
        if (retriable && attempt < maxRetries) {
          attempt++;
          const delay = 300 * attempt;
          console.warn(
            `⏱️ Retry GET ${url} (tentativa ${attempt}/${maxRetries}) após ${delay}ms`
          );
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Upload de arquivos
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Verificar se a API está disponível
  isApiOnline(): boolean {
    return this.isApiAvailable;
  }

  // Forçar modo offline
  setOfflineMode(): void {
    this.isApiAvailable = false;
  }

  // Forçar modo online
  setOnlineMode(): void {
    this.isApiAvailable = true;
  }
}

// Helper: normalize various list response shapes to a plain array
// It gracefully handles:
// - data is already an array
// - data has a known array property (items, results, users, projects, etc.)
// - data is an object where one of its values is an array (fallback)
export function normalizeListResponse<T = any>(
  data: any,
  preferKeys: string[] = [
    'items',
    'results',
    'data',
    'list',
    'records',
    'rows',
    'users',
    'projects',
    'tags',
    'visits',
    'notifications',
    'contracts',
    'locations',
  ]
): T[] {
  try {
    if (Array.isArray(data)) return data as T[];

    if (data && typeof data === 'object') {
      for (const key of preferKeys) {
        const val = (data as any)[key];
        if (Array.isArray(val)) return val as T[];
      }
      // Fallback: first array value
      for (const val of Object.values(data)) {
        if (Array.isArray(val)) return val as T[];
      }
    }
  } catch {}
  return [] as T[];
}

export const apiService = new ApiService();
