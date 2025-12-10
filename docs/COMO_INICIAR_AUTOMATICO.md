# 🚀 Como Iniciar o Servidor Automaticamente

Como há um problema com o terminal integrado do Cursor, aqui estão **3 formas automáticas** de iniciar o servidor:

## ✅ Método 1: Usar Tarefas do VS Code (Recomendado)

1. **Pressione `Ctrl+Shift+P`** (ou `Cmd+Shift+P` no Mac)
2. Digite: **"Tasks: Run Task"**
3. Selecione: **"Iniciar Servidor Completo"**

Isso vai executar o script batch automaticamente e abrir as janelas do backend e frontend.

## ✅ Método 2: Atalho de Teclado

Você pode criar um atalho personalizado:

1. Pressione `Ctrl+K Ctrl+S` para abrir atalhos de teclado
2. Procure por "workbench.action.tasks.runTask"
3. Configure um atalho (ex: `Ctrl+Alt+S`)
4. Quando pressionar o atalho, selecione "Iniciar Servidor Completo"

## ✅ Método 3: Botão na Barra de Tarefas

1. Vá em **Terminal > Run Task...**
2. Selecione **"Iniciar Servidor Completo"**

## 📋 Tarefas Disponíveis

As seguintes tarefas foram configuradas:

- **Iniciar Servidor Completo** - Inicia backend e frontend juntos
- **Iniciar Backend** - Apenas o backend
- **Iniciar Frontend** - Apenas o frontend
- **Iniciar com Python Script** - Usa o script Python `run_project.py`

## 🔧 Se Nada Funcionar

Como último recurso, você pode:

1. **Clicar com botão direito** no arquivo `INICIAR_SEM_DOCKER.bat`
2. Selecionar **"Run in Terminal"** ou **"Open in Integrated Terminal"**
3. Isso deve executar mesmo com o problema do terminal

## 💡 Dica

Se você quiser que o servidor inicie automaticamente ao abrir o projeto, você pode:

1. Criar um arquivo `.vscode/launch.json` com configurações de debug
2. Ou usar extensões como "Task Explorer" para gerenciar tarefas visualmente


