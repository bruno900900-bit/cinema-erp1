# 🚀 Como Iniciar o Servidor Manualmente

Como há um problema com o sistema de execução de comandos do Cursor, siga estes passos para iniciar o servidor manualmente:

## ✅ Método 1: Script Batch (Mais Fácil)

1. **Abra o Terminal do Windows** (não use o terminal integrado do Cursor)
   - Pressione `Win + R`
   - Digite `cmd` e pressione Enter
   - OU abra PowerShell

2. **Navegue até a pasta do projeto:**
   ```bash
   cd C:\Users\werbi\cinema-erp
   ```

3. **Execute o script:**
   ```bash
   iniciar_servidor_simples.bat
   ```

   Ou use qualquer um destes:
   ```bash
   INICIAR_SEM_DOCKER.bat
   INICIAR_AQUI.bat
   ```

4. **Aguarde** - O script vai:
   - Criar ambiente virtual Python (se necessário)
   - Instalar dependências
   - Configurar banco de dados
   - Abrir duas janelas (Backend e Frontend)

## ✅ Método 2: Manual (Passo a Passo)

### Terminal 1 - Backend

```bash
cd C:\Users\werbi\cinema-erp\backend

# Criar ambiente virtual (só na primeira vez)
python -m venv venv

# Ativar ambiente virtual
venv\Scripts\activate

# Instalar dependências (só na primeira vez)
pip install -r requirements.txt

# Configurar banco de dados
python setup_database.py

# Iniciar servidor
python run_app.py
```

### Terminal 2 - Frontend

```bash
cd C:\Users\werbi\cinema-erp\frontend

# Instalar dependências (só na primeira vez)
npm install

# Criar arquivo .env.local (só na primeira vez)
echo VITE_API_BASE_URL=http://localhost:8000/api/v1 > .env.local

# Iniciar servidor
npm run dev
```

## 📍 URLs Após Iniciar

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## ⚠️ Importante

- **NÃO feche** as janelas do Backend e Frontend enquanto estiver usando
- Para parar os servidores, pressione `Ctrl+C` em cada janela ou feche as janelas

## 🔧 Verificar se Está Funcionando

Abra o navegador e acesse:
- http://localhost:8000/health (deve retornar `{"status":"healthy"}`)
- http://localhost:5173 (deve abrir o frontend)

## ❌ Se Der Erro

1. **Verifique se Python está instalado:**
   ```bash
   python --version
   ```
   Deve mostrar Python 3.11 ou superior

2. **Verifique se Node.js está instalado:**
   ```bash
   node --version
   ```
   Deve mostrar v18 ou superior

3. **Execute o script de verificação:**
   ```bash
   verificar_ambiente.bat
   ```


