# 🧪 Teste Manual - Sistema de Fotos

## ✅ **Funcionalidades Implementadas**

### 1. **Sistema de Fotos Completo**

- ✅ Modelo `LocationPhoto` atualizado
- ✅ Schema `LocationResponse` com fotos
- ✅ Serviço `PhotoService` funcional
- ✅ Endpoints para upload e busca de fotos
- ✅ Armazenamento local de arquivos
- ✅ Geração de miniaturas

### 2. **Novo Endpoint: Criar Localização com Fotos**

- ✅ `POST /api/v1/locations/with-photos`
- ✅ Aceita múltiplas fotos
- ✅ Suporte a captions
- ✅ Definição de foto principal

## 🚀 **Como Testar Manualmente**

### **Passo 1: Iniciar o Servidor**

```bash
cd backend
py run_server.py
```

### **Passo 2: Acessar a Documentação**

- Abra o navegador em: http://localhost:8000/docs
- Procure pelo endpoint `POST /api/v1/locations/with-photos`

### **Passo 3: Testar Upload de Fotos**

#### **3.1. Preparar Fotos de Teste**

- Crie algumas imagens JPG/PNG
- Ou use fotos existentes no seu computador

#### **3.2. Usar o Endpoint**

1. **Clique** em `POST /api/v1/locations/with-photos`
2. **Clique** em "Try it out"
3. **Preencha** os campos obrigatórios:
   - `title`: "Estúdio de Teste"
   - `city`: "São Paulo"
   - `status`: "draft"
4. **Adicione fotos**:
   - Clique em "Choose Files" no campo `photos`
   - Selecione suas imagens
5. **Adicione captions** (opcional):
   - `photo_captions`: ["Foto principal", "Área de gravação"]
6. **Defina foto principal**:
   - `primary_photo_index`: 0 (primeira foto)
7. **Clique** em "Execute"

### **Passo 4: Verificar Resultado**

- ✅ Status 200 = Sucesso
- ✅ Resposta deve incluir `photos` array
- ✅ Cada foto deve ter `url` e `thumbnail_url`

### **Passo 5: Testar Busca**

1. **Copie** o `id` da localização criada
2. **Use** `GET /api/v1/locations/{id}`
3. **Verifique** se as fotos aparecem na resposta

### **Passo 6: Testar URLs das Fotos**

- **Copie** uma URL de foto da resposta
- **Acesse** no navegador: `http://localhost:8000{url}`
- ✅ Deve mostrar a imagem

## 📋 **Endpoints Disponíveis**

### **Criação de Localização**

- `POST /api/v1/locations/` - Criar sem fotos
- `POST /api/v1/locations/with-photos` - Criar com fotos

### **Gerenciamento de Fotos**

- `GET /api/v1/locations/{id}/photos` - Listar fotos
- `POST /api/v1/locations/{id}/photos` - Adicionar foto
- `DELETE /api/v1/locations/{id}/photos/{photo_id}` - Remover foto

### **Busca de Localizações**

- `GET /api/v1/locations/` - Listar todas
- `GET /api/v1/locations/{id}` - Buscar específica

## 🎯 **Teste no Frontend**

### **1. Acessar Interface**

- Abra o frontend em: http://localhost:3000
- Vá para a aba "Localizações"

### **2. Verificar Fotos**

- ✅ Fotos devem aparecer nos cards
- ✅ Modal de detalhes deve mostrar galeria
- ✅ Foto principal deve ser destacada

### **3. Testar Upload**

- ✅ Botão de upload deve funcionar
- ✅ Múltiplas fotos devem ser aceitas
- ✅ Preview das fotos deve aparecer

## 🐛 **Solução de Problemas**

### **Servidor não inicia**

```bash
# Verificar se está no diretório correto
cd backend

# Tentar diferentes formas de iniciar
py run_server.py
# ou
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### **Erro de importação**

```bash
# Verificar se o app pode ser importado
py -c "from app.main import app; print('OK')"
```

### **Fotos não aparecem**

- ✅ Verificar se o diretório `uploads/` existe
- ✅ Verificar permissões de escrita
- ✅ Verificar se as URLs estão corretas

### **Erro 404 nas fotos**

- ✅ Verificar se o endpoint `/uploads` está configurado
- ✅ Verificar se os arquivos existem no disco

## 📁 **Estrutura de Arquivos**

```
backend/
├── uploads/
│   └── locations/
│       └── {location_id}/
│           ├── {filename}.jpg
│           ├── thumb_{filename}.jpg
│           └── ...
├── app/
│   ├── models/location_photo.py
│   ├── schemas/location.py
│   ├── services/photo_service.py
│   └── api/v1/endpoints/locations.py
└── test_location_with_photos.py
```

## ✅ **Checklist de Teste**

- [ ] Servidor inicia sem erros
- [ ] Documentação acessível em /docs
- [ ] Endpoint with-photos aparece na documentação
- [ ] Upload de fotos funciona
- [ ] Localização é criada com sucesso
- [ ] Fotos aparecem na resposta
- [ ] URLs das fotos são acessíveis
- [ ] Frontend mostra as fotos
- [ ] Galeria funciona no modal
- [ ] Foto principal é destacada

## 🎉 **Resultado Esperado**

Após seguir todos os passos, você deve ter:

- ✅ Localização criada com fotos
- ✅ Fotos visíveis na interface
- ✅ Sistema de upload funcionando
- ✅ Galeria de fotos operacional

---

**🚀 Pronto para testar!** Siga os passos acima e verifique se tudo está funcionando corretamente.

