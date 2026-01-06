FROM node:18-bullseye-slim

# Instalar dependências do sistema necessárias para o Puppeteer/Chrome e compilação nativa
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    wait-for-it \
    git \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis de ambiente do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar APENAS o package.json (ignorando o lockfile do Windows para evitar conflitos)
COPY package.json ./

# Instalar dependências do Node (sem --production para garantir scripts de build)
# --no-optional para evitar falhas em dependências opcionais de sistema
RUN npm install --no-optional

# Copiar o restante do código
COPY . .

# Expor a porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "server.js"]
