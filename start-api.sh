#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "    🚀 CINEMA ERP - API SERVER"
echo "========================================"
echo -e "${NC}"

echo -e "${YELLOW}🔍 Verificando dependências...${NC}"
cd backend

echo ""
echo -e "${YELLOW}📦 Verificando se Python está instalado...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 não encontrado! Instale Python 3.8+ primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python encontrado!${NC}"

echo ""
echo -e "${YELLOW}📦 Verificando dependências...${NC}"
if ! pip3 list | grep -q fastapi; then
    echo -e "${YELLOW}⚠️  Dependências não encontradas. Instalando...${NC}"
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependências instaladas!${NC}"
else
    echo -e "${GREEN}✅ Dependências já instaladas!${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Iniciando servidor da API...${NC}"
echo ""
echo -e "${BLUE}🌐 URL da API: http://127.0.0.1:8000${NC}"
echo -e "${BLUE}📚 Documentação: http://127.0.0.1:8000/docs${NC}"
echo -e "${BLUE}🔍 Health Check: http://127.0.0.1:8000/health${NC}"
echo ""
echo -e "${YELLOW}⏹️  Pressione Ctrl+C para parar o servidor${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

python3 simple_server.py

echo ""
echo -e "${RED}🛑 Servidor parado.${NC}"


