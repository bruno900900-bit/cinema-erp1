# 🔧 Solução: Problema com Caminhos Personalizados

Baseado na sua observação sobre caminhos personalizados, aqui estão soluções para garantir que tudo funcione corretamente:

## 🔍 Diagnóstico

Execute o script de diagnóstico para verificar se há problemas com variáveis de ambiente ou caminhos:

```powershell
.\diagnosticar_terminal.ps1
```

Isso vai verificar:
- Variáveis de ambiente (PATH, HOME, USERPROFILE, etc.)
- Caminhos do Python e Node.js
- Scripts do projeto
- Entradas vazias ou problemáticas no PATH

## 🛠️ Correção Automática

Se o diagnóstico encontrar problemas, execute:

```powershell
.\corrigir_ambiente.ps1
```

Este script vai:
- Limpar entradas vazias do PATH
- Configurar variável HOME se necessário
- Verificar e corrigir variáveis temporárias

**⚠️ IMPORTANTE:** Após executar a correção, **reinicie o Cursor/VS Code** para que as mudanças tenham efeito!

## ✅ Solução com Caminhos Absolutos

Criei um script que usa **caminhos absolutos** para evitar problemas:

```bash
.\iniciar_absoluto.bat
```

Este script:
- Usa caminhos absolutos baseados na localização do script
- Não depende de variáveis de ambiente que possam estar undefined
- Funciona mesmo se houver problemas com PATH ou HOME

## 🎯 Como Usar

### Opção 1: Script com Caminhos Absolutos (Recomendado)

1. Execute diretamente no Terminal do Windows:
   ```bash
   cd C:\Users\werbi\cinema-erp
   .\iniciar_absoluto.bat
   ```

### Opção 2: Usar Tarefas do VS Code

1. Pressione `Ctrl+Shift+P`
2. Digite: "Tasks: Run Task"
3. Selecione: "Iniciar Servidor Completo"

### Opção 3: Diagnóstico e Correção

1. Execute diagnóstico:
   ```powershell
   .\diagnosticar_terminal.ps1
   ```

2. Se encontrar problemas, execute correção:
   ```powershell
   .\corrigir_ambiente.ps1
   ```

3. **Reinicie o Cursor/VS Code**

4. Tente iniciar novamente

## 🔑 Pontos Importantes

1. **Caminhos Absolutos**: O script `iniciar_absoluto.bat` usa caminhos absolutos, então não depende de variáveis de ambiente

2. **Variável HOME**: Se você instalou algo em um caminho personalizado (como mencionado sobre Dalai), certifique-se de que a variável HOME está configurada corretamente

3. **PATH Limpo**: Entradas vazias no PATH podem causar problemas. O script de correção remove essas entradas

4. **Reiniciar**: Sempre reinicie o Cursor/VS Code após modificar variáveis de ambiente

## 📝 Se Nada Funcionar

Se mesmo com caminhos absolutos o problema persistir:

1. Verifique se há espaços ou caracteres especiais no caminho do projeto
2. Tente mover o projeto para um caminho sem espaços (ex: `C:\projetos\cinema-erp`)
3. Execute como Administrador
4. Verifique permissões das pastas


