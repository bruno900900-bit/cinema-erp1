# Cloud Function de Thumbnails

## Visão Geral

Geração automática de miniaturas para imagens enviadas ao Firebase Storage em `locations/<location_id>/`.

## Trigger

- Evento: finalize (upload concluído) em Storage
- Filtro: apenas objetos cujo caminho comece com `locations/`
- Ignora arquivos já com prefixo `thumb_`.

## Processo

1. Download da imagem original em memória
2. Redimensiona (máx 600x600, mantendo proporção) via `sharp`
3. Converte para `webp` qualidade 80
4. Salva com nome `thumb_<original>` no mesmo diretório
5. Torna público se `FIREBASE_PUBLIC_PHOTOS=true`

## Estrutura criada

```
functions/
  package.json
  tsconfig.json
  src/index.ts (generateLocationThumbnail)
```

## Variáveis de Ambiente

- `FIREBASE_PUBLIC_PHOTOS` (compartilhada com backend) controla se thumbnails serão públicas.

## Deploy

```
cd functions
npm install
npm run build
firebase deploy --only functions
```

Ou usando script root (se adicionar):

```
npm --prefix functions run deploy
```

## Backend Integração

`PhotoService` agora gera URL estimada da thumbnail quando a imagem original está em Storage público substituindo o nome do arquivo por `thumb_<arquivo>`.
A thumbnail aparecerá para o cliente após a função concluir (pode haver pequeno delay).

## Próximos Melhoramentos

- Validar cabeçalhos Cache-Control para originais (adicionar se ausente)
- Suporte a múltiplos tamanhos (ex: 300, 800)
- Limpeza automática de thumbnails órfãs
- Geração de URLs assinadas se fotos não forem públicas
