# 🌐 Guia de Acesso Público - Cinema ERP

## 📋 Passo a Passo

### 1. Liberar Firewall (Execute como Administrador)

```batch
# Clique com botão direito em "liberar_firewall.bat" e selecione "Executar como administrador"
```

Isso vai liberar as portas:

- **8000** - Backend API
- **5173** - Frontend

### 2. Iniciar o Sistema

```batch
# Execute o arquivo:
start_system_public.bat
```

Isso vai:

- ✅ Parar processos anteriores
- ✅ Iniciar o Backend na porta 8000 (0.0.0.0)
- ✅ Iniciar o Frontend na porta 5173 (0.0.0.0)

### 3. Descobrir seu IP

#### IP Local (rede interna):

```bash
ipconfig
# Procure por "IPv4" - exemplo: 192.168.1.100
```

#### IP Público (internet):

```bash
curl ifconfig.me
# ou acesse: https://www.whatismyip.com
```

## 🔓 URLs de Acesso

### Acesso Local (mesma máquina):

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Acesso na Rede Local:

Substitua `SEU_IP_LOCAL` pelo IP obtido no `ipconfig`:

- Frontend: `http://SEU_IP_LOCAL:5173`
- Backend: `http://SEU_IP_LOCAL:8000`

**Exemplo:**

- Frontend: `http://192.168.1.100:5173`
- Backend: `http://192.168.1.100:8000`

### Acesso pela Internet:

Substitua `SEU_IP_PUBLICO` pelo IP obtido em `ifconfig.me`:

- Frontend: `http://SEU_IP_PUBLICO:5173`
- Backend: `http://SEU_IP_PUBLICO:8000`

**⚠️ IMPORTANTE:** Para acesso pela internet, você precisa configurar **Port Forwarding** no seu roteador!

## 🛠️ Configurar Port Forwarding no Roteador

### Passos gerais:

1. **Acesse o roteador**

   - Geralmente: `http://192.168.0.1` ou `http://192.168.1.1`
   - Login: admin/admin (varia por fabricante)

2. **Encontre a seção de Port Forwarding**

   - Pode estar em: "NAT", "Virtual Server", "Port Forwarding"

3. **Adicione as regras:**

   **Regra 1 - Backend:**

   - Nome: Cinema ERP Backend
   - Porta Externa: 8000
   - Porta Interna: 8000
   - IP Local: [SEU_IP_LOCAL - ex: 192.168.1.100]
   - Protocolo: TCP

   **Regra 2 - Frontend:**

   - Nome: Cinema ERP Frontend
   - Porta Externa: 5173
   - Porta Interna: 5173
   - IP Local: [SEU_IP_LOCAL - ex: 192.168.1.100]
   - Protocolo: TCP

4. **Salve e Reinicie o roteador** (se necessário)

## 🔐 Segurança

### ⚠️ AVISOS IMPORTANTES:

1. **IP Dinâmico**: Seu IP público pode mudar. Considere usar:

   - **No-IP** ou **DuckDNS** (DNS dinâmico gratuito)
   - Serviços de túnel: **ngrok**, **Cloudflare Tunnel**

2. **HTTPS**: O sistema roda em HTTP. Para produção:

   - Use um proxy reverso (nginx) com certificado SSL
   - Ou faça deploy em Cloud Run + Firebase Hosting

3. **Autenticação**: Configure autenticação forte no sistema

4. **Firewall**: Mantenha firewall ativo, liberando apenas as portas necessárias

## 🚀 Alternativas para Acesso Público

### Opção 1: ngrok (Túnel Temporário)

```bash
# Instalar ngrok: https://ngrok.com/download

# Backend
ngrok http 8000

# Frontend (em outro terminal)
ngrok http 5173
```

Você receberá URLs públicas temporárias como:

- `https://abc123.ngrok.io` → Backend
- `https://xyz789.ngrok.io` → Frontend

### Opção 2: Deploy em Cloud (Recomendado para Produção)

```powershell
# O projeto já tem scripts de deploy!
.\deploy_cloudrun_hosting.ps1 -ProjectId palaoro-production
```

Isso faz deploy em:

- **Cloud Run**: Backend com HTTPS automático
- **Firebase Hosting**: Frontend com CDN global

## 📞 Suporte

Se precisar de ajuda:

1. Verifique os logs nas janelas de terminal abertas
2. Teste acesso local primeiro (`localhost`)
3. Teste rede local antes de tentar acesso público
4. Verifique firewall e antivírus

---

**Desenvolvido com ❤️ para a indústria cinematográfica**









