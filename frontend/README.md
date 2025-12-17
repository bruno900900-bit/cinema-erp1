# Cinema ERP - Frontend

Sistema de gestão de locações para cinema e publicidade.

## 🚀 Deploy no Cloudflare Pages

Para instruções completas de deploy, veja [DEPLOY.md](./DEPLOY.md).

### Quick Start

```bash
# Build local
npm run build

# Preview local
npm run preview

# Deploy
npm run deploy
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie arquivo `.env.local` para desenvolvimento:

```env
VITE_SUPABASE_URL=https://rwpmtuohcvnciemtsjge.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=development
```

**Produção**: Configure via Cloudflare Dashboard (ver DEPLOY.md)

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Type check
npm run typecheck
```

## 📦 Estrutura

```
frontend/
├── public/           # Assets estáticos
│   └── _redirects   # SPA fallback para Cloudflare Pages
├── src/
│   ├── components/  # Componentes React
│   ├── pages/       # Páginas da aplicação
│   ├── services/    # Serviços (API, Supabase)
│   ├── hooks/       # Custom hooks
│   ├── types/       # TypeScript types
│   └── utils/       # Utilitários
├── .env.production  # Env vars para produção
├── vite.config.js   # Configuração Vite
├── wrangler.toml    # Configuração Cloudflare Pages
└── DEPLOY.md        # Guia de deploy
```

## 🔧 Stack Tecnológico

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **UI**: Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: Formik + Yup
- **Deploy**: Cloudflare Pages

## 📝 Arquitetura

O frontend se comunica **diretamente com Supabase**:

```
Frontend → Supabase Client → PostgreSQL
                          → Auth
                          → Storage
```

> ⚠️ O backend FastAPI não é mais utilizado. Veja [analise_arquitetura.md](../brain/analise_arquitetura.md) para detalhes.

## 🔒 Segurança

- Row Level Security (RLS) no Supabase
- Autenticação via Supabase Auth
- HTTPS obrigatório em produção
- Security headers configurados

## 📱 Funcionalidades

- ✅ Gestão de locações
- ✅ Gestão de projetos
- ✅ Upload de fotos (Supabase Storage)
- ✅ Sistema de tags
- ✅ Agenda de visitas
- ✅ Gestão de usuários e permissões
- ✅ Dashboard com métricas

## 🐛 Troubleshooting

Ver seção completa em [DEPLOY.md](./DEPLOY.md#troubleshooting).

## 📄 Licença

Proprietary - Todos os direitos reservados
