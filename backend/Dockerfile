FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Expor porta (informativo)
EXPOSE 8080

# Cloud Run fornece PORT via env (padrão 8080)
ENV PORT=8080
ENV DATABASE_URL=sqlite:////tmp/cinema_erp.db

# Comando de execução (sem reload em produção) - usar shell para expandir $PORT em runtime
CMD ["sh", "-c", "python -c 'import app.main' && uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --timeout-keep-alive 30"]
