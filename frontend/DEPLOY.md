# Deploy no Cloudflare Pages - Cinema ERP

## Pré-requisitos

- ✅ Conta no Cloudflare
- ✅ Wrangler CLI: `npm install -g wrangler`
- ✅ Autenticado: `wrangler login`

## Configuração Inicial (Uma vez apenas)

### 1. Criar Projeto no Cloudflare Pages

**Via Dashboard:**

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages
2. **Create a project** > **Connect to Git**
3. Selecione o repositório do GitHub/GitLab
4. Configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend` (se monorepo)

### 2. Configurar Variáveis de Ambiente

⚠️ **CRÍTICO**: No Cloudflare Dashboard > Pages > Settings > Environment variables

**Production Environment:**

```
VITE_SUPABASE_URL=https://mjrjjslawywdcgvaxtzv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM1NzYsImV4cCI6MjA4MDg4OTU3Nn0.Wpkkzef7vTKQGQ5CZX41-qXHoQu4r_r67lK-fmvWQV8
VITE_APP_ENV=production
```

**Preview Environment (Opcional):**
Mesmas variáveis para branches de preview

---

## Deploy

### Opção 1: Deploy Automático (Recomendado)

Qualquer push para `main` dispara deploy automático:

```bash
git add .
git commit -m "feat: deploy changes"
git push origin main
```

Cloudflare Pages detecta e faz deploy automaticamente. ✨

### Opção 2: Deploy Manual via CLI

```bash
cd frontend
npm run deploy
```

Ou com build otimizado:

```bash
npm run deploy:production
```

### Opção 3: Build Local + Deploy

```bash
# Build local
npm run build

# Deploy do diretório dist
wrangler pages deploy dist --project-name cinema-erp-frontend
```

---

## Verificação Pós-Deploy

Após deploy bem-sucedido, teste:

### ✅ Checklist de Validação

1. **Autenticação Supabase**

   - [ ] Acessar URL do Cloudflare Pages
   - [ ] Fazer login com credenciais válidas
   - [ ] Dashboard carrega sem erros
   - [ ] Console do navegador: sem erros

2. **CRUD de Locações**

   - [ ] Criar nova locação
   - [ ] Listar todas as locações
   - [ ] Editar locação existente
   - [ ] Deletar locação

3. **Upload de Fotos**

   - [ ] Upload de foto em locação
   - [ ] Foto aparece corretamente
   - [ ] Thumbnail funciona
   - [ ] Galeria exibe todas as fotos

4. **Navegação SPA**

   - [ ] Todas as rotas principais funcionam
   - [ ] F5 (refresh) não dá erro 404
   - [ ] Botão voltar do navegador funciona
   - [ ] Deep links funcionam

5. **Performance**
   - [ ] Lighthouse score > 80
   - [ ] First Contentful Paint < 2s
   - [ ] Time to Interactive < 3s

---

## Troubleshooting

### ❌ Erro: "Failed to fetch" ao fazer login

**Causa**: Variáveis de ambiente não configuradas ou incorretas

**Solução**:

1. Acesse Cloudflare Dashboard > Pages > Settings > Environment variables
2. Verifique que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
3. Retriggering deploy: Pages > Deployments > Retry deployment

### ❌ Erro 404 nas rotas (ex: /projects)

**Causa**: Falta configuração de SPA fallback

**Solução**:

1. Verificar se `public/_redirects` existe
2. Deve conter: `/* /index.html 200`
3. Rebuild e redeploy

### ❌ Imagens não carregam

**Causa**: Problema com Supabase Storage ou RLS

**Solução**:

1. Verifique bucket `location-photos` no Supabase Dashboard
2. Confirme políticas RLS permitem acesso público às fotos
3. Teste URL das imagens diretamente no navegador

### ❌ Build falha no Cloudflare

**Causa**: Dependências faltando ou erro de build

**Solução**:

1. Rode `npm run build` localmente para reproduzir erro
2. Verifique logs completos no Cloudflare Dashboard
3. Verifique Node version (recomendado: 18.x ou 20.x)

### ❌ "Module not found" em produção

**Causa**: Import paths case-sensitive ou aliases não resolvidos

**Solução**:

1. Verifique imports: devem usar case correto
2. Aliases `@/` devem estar em `vite.config.js`
3. Rebuild: `npm run build:production`

---

## Comandos Úteis

```bash
# Build local para teste
npm run build

# Preview do build local
npm run preview

# Deploy via CLI
npm run deploy

# Deploy otimizado
npm run deploy:production

# Verificar logs do Wrangler
wrangler pages deployment list

# Abrir dashboard do projeto
wrangler pages project view cinema-erp-frontend
```

---

## Rollback

Se um deploy quebrar a aplicação:

1. Acesse Cloudflare Dashboard > Pages > Deployments
2. Localize deployment anterior que funcionava
3. Clique em **"⋮"** > **"Rollback to this deployment"**
4. Confirme rollback

✅ Rollback é instantâneo!

---

## Notas Importantes

> [!IMPORTANT] > **Variáveis sensíveis (SUPABASE_ANON_KEY) devem ser configuradas APENAS via Cloudflare Dashboard**, nunca commitadas no Git.

> [!WARNING]
> Após alterações em environment variables, é necessário **retriggerar deploy** (não é automático).

> [!TIP]
> Para ambientes de staging, crie branch `staging` e configure variáveis separadas no Cloudflare.

---

## URLs Úteis

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Supabase Dashboard**: https://app.supabase.com
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/

---

_Última atualização: 2025-12-12_
