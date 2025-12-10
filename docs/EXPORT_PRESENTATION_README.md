# 📊 Exportação de Apresentações PowerPoint - Cinema ERP

## 🎯 **Funcionalidade Implementada**

Sistema completo para exportar locações selecionadas em apresentações PowerPoint (.pptx) com interface drag & drop para reordenação.

## 🏗️ **Arquitetura da Solução**

### **Backend (FastAPI)**
- **Endpoint**: `POST /api/export/presentation/download`
- **Serviço**: `PresentationExportService` usando `python-pptx`
- **Schema**: `PresentationExportRequest` com validações
- **Autenticação**: JWT obrigatório

### **Frontend (React)**
- **Componente**: `PresentationExportModal` com drag & drop
- **Serviço**: `exportService` para chamadas à API
- **Integração**: Botão na página de locações

## 🚀 **Como Usar**

### **1. Acessar a Funcionalidade**
- Navegue para **Locações** no menu lateral
- Clique no botão **"Exportar Apresentação"** no header
- O modal será aberto com as locações dos resultados da busca

### **2. Selecionar e Reordenar Locações**
- **Drag & Drop**: Arraste as locações para reordenar
- **Remover**: Clique no ícone de lixeira para remover locações
- **Visualização**: Veja informações como preço, capacidade e fotos

### **3. Configurar Opções**
- **Nome do arquivo**: Personalize o nome do arquivo PPTX
- **Template**: Escolha entre Padrão, Corporativo, Criativo ou Minimalista
- **Fotos**: Marque para incluir fotos das locações
- **Resumo**: Marque para incluir slide de estatísticas

### **4. Exportar**
- Clique em **"Exportar Apresentação"**
- O arquivo será baixado automaticamente
- Formato: `.pptx` (PowerPoint)

## 📋 **Estrutura da Apresentação Gerada**

### **Slide 1: Título**
- Nome da apresentação
- Subtítulo com informações do sistema
- Contador de locações incluídas

### **Slides 2-N: Locações**
- **Header**: Nome da locação + número do slide
- **Lado Esquerdo**: Informações detalhadas
  - 📍 Endereço completo
  - 💰 Preço formatado
  - 👥 Capacidade
  - 📏 Área
  - 📝 Descrição (truncada)
  - 🏷️ Tags (máximo 5)
- **Lado Direito**: Foto da locação ou placeholder
- **Status**: Indicador colorido no canto superior direito

### **Slide Final: Resumo**
- 📊 Total de locações
- 💰 Valor total agregado
- 👥 Capacidade total
- 📏 Área média
- 📈 Distribuição por status

## 🔧 **Configuração e Instalação**

### **Backend - Dependências**
```bash
# Instalar python-pptx
pip install python-pptx==0.6.21

# Ou via requirements.txt
pip install -r requirements.txt
```

### **Frontend - Dependências**
```bash
# Instalar react-beautiful-dnd
npm install react-beautiful-dnd@^13.1.1
npm install @types/react-beautiful-dnd@^13.1.8
```

### **Variáveis de Ambiente**
```env
# Backend (.env)
EXPORT_TEMPLATES_PATH=/path/to/templates
EXPORT_CACHE_TTL=3600
```

## 📡 **API Endpoints**

### **Exportar e Download Direto**
```http
POST /api/export/presentation/download
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "location_ids": [1, 2, 3],
  "order": [2, 0, 1],
  "include_photos": true,
  "include_summary": true,
  "template_name": "default"
}
```

### **Gerar Apresentação (Info)**
```http
POST /api/export/presentation
Content-Type: application/json
Authorization: Bearer <jwt_token>

# Retorna informações do arquivo gerado
{
  "success": true,
  "message": "Apresentação gerada com sucesso",
  "file_name": "apresentacao_locacoes_20241201_143022_abc12345.pptx",
  "file_size": 2048576,
  "total_slides": 5,
  "locations_included": 3,
  "download_url": "/api/export/download/abc12345"
}
```

### **Download por ID**
```http
GET /api/export/download/{file_id}
Authorization: Bearer <jwt_token>
```

## 🎨 **Templates Disponíveis**

### **1. Padrão (default)**
- Cores: Azul corporativo (#1976d2)
- Layout: Limpo e profissional
- Tipografia: Roboto, tamanhos padrão

### **2. Corporativo**
- Cores: Tons de cinza e azul escuro
- Layout: Formal e estruturado
- Tipografia: Arial, tamanhos maiores

### **3. Criativo**
- Cores: Gradientes e cores vibrantes
- Layout: Assimétrico e dinâmico
- Tipografia: Fontes variadas

### **4. Minimalista**
- Cores: Preto, branco e cinza
- Layout: Espaçamento generoso
- Tipografia: Helvetica, pesos finos

## 🔄 **Fluxo de Dados**

```
Frontend → API → Serviço → python-pptx → Arquivo PPTX → Download
   ↓           ↓         ↓         ↓           ↓         ↓
Modal → ExportService → FastAPI → ExportService → Bytes → Blob
```

## 🚧 **Limitações Atuais**

- **Máximo**: 50 locações por apresentação
- **Fotos**: Apenas primeira foto por locação
- **Templates**: 4 templates básicos
- **Idioma**: Interface em português, conteúdo em português

## 🔮 **Roadmap Futuro**

### **Versão 1.1**
- [ ] Templates personalizáveis
- [ ] Múltiplas fotos por slide
- [ ] Animações e transições
- [ ] Exportação para Google Slides

### **Versão 1.2**
- [ ] Editor de templates visual
- [ ] Marca d'água personalizada
- [ ] Metadados do arquivo
- [ ] Cache de apresentações

### **Versão 2.0**
- [ ] IA para sugestões de layout
- [ ] Integração com outros formatos (PDF, Keynote)
- [ ] Colaboração em tempo real
- [ ] Histórico de exportações

## 🧪 **Testes**

### **Backend**
```bash
cd backend
pytest tests/test_presentation_export.py -v
```

### **Frontend**
```bash
cd frontend
npm test -- --testPathPattern=PresentationExportModal
```

## 📝 **Exemplo de Uso Completo**

```typescript
// Frontend - Chamada do serviço
import { exportService } from '@/services/exportService';

const handleExport = async () => {
  try {
    const exportData = {
      location_ids: [1, 2, 3, 4],
      order: [3, 1, 4, 2],
      include_photos: true,
      include_summary: true,
      template_name: 'corporate'
    };

    const response = await exportService.exportPresentation(exportData);

    // Download automático
    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'minha_apresentacao.pptx';
    link.click();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Erro na exportação:', error);
  }
};
```

## 🆘 **Solução de Problemas**

### **Erro: "python-pptx não encontrado"**
```bash
pip install python-pptx
# Verificar versão: pip show python-pptx
```

### **Erro: "react-beautiful-dnd não encontrado"**
```bash
npm install react-beautiful-dnd
npm install @types/react-beautiful-dnd
```

### **Arquivo não baixa**
- Verificar permissões do navegador
- Verificar se o endpoint retorna `Content-Disposition`
- Verificar se o token JWT é válido

### **Apresentação vazia**
- Verificar se as locações existem no banco
- Verificar se as fotos estão acessíveis
- Verificar logs do backend

## 📞 **Suporte**

- **Issues**: GitHub Issues com tag `export-presentation`
- **Documentação**: Este arquivo + comentários no código
- **Email**: suporte@cinema-erp.com

---

**Desenvolvido com ❤️ para facilitar apresentações de locações**
