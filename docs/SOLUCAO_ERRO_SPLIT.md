# Solução para o Erro "Cannot read properties of undefined (reading 'split')"

## 🔍 O que é esse erro?

Este erro **NÃO é um problema do seu código**, mas sim um bug conhecido no sistema de execução de comandos do Cursor quando usa PowerShell. O erro acontece na camada de processamento de comandos do Cursor, não no seu projeto.

## ✅ Soluções

### Solução 1: Usar Scripts Batch (Recomendado)

Execute diretamente no **Terminal do Windows** (não pelo Cursor):

```bash
.\INICIAR_SEM_DOCKER.bat
```

ou

```bash
.\INICIAR_AQUI.bat
```

Esses scripts funcionam perfeitamente e não dependem do sistema de execução do Cursor.

### Solução 2: Executar Manualmente

Abra **dois terminais separados** (cmd ou PowerShell):

#### Terminal 1 - Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python setup_database.py
python run_app.py
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Solução 3: Usar PowerShell Diretamente

Abra o PowerShell do Windows (não o terminal integrado do Cursor) e execute:

```powershell
cd C:\Users\werbi\cinema-erp
.\INICIAR_SEM_DOCKER.bat
```

## 🔧 Verificar Ambiente

Execute o script de verificação:

```bash
.\verificar_ambiente.bat
```

Isso vai verificar se Python, Node.js, npm e pip estão instalados corretamente.

## 📍 URLs Após Iniciar

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 💡 Dica

Se o erro persistir mesmo usando os scripts batch diretamente, pode ser um problema com:
- Variáveis de ambiente do Windows corrompidas
- Permissões do PowerShell
- Configuração do PATH

Nesse caso, tente:
1. Reiniciar o computador
2. Executar o terminal como Administrador
3. Verificar se Python e Node.js estão no PATH do sistema


