FROM node:18-bullseye-slim

# Instalar dependências do sistema necessárias para o Puppeteer/Chrome
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
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis de ambiente do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro (cache layer)
COPY package*.json ./

# Instalar dependências do Node
RUN npm install --production

# Copiar o restante do código
COPY . .

# Expor a porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "server.js"]
