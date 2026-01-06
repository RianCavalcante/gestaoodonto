FROM node:18-bullseye-slim

# Instalar ferramentas básicas de compilação (para dependências nativas como socket.io/bufferutil)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar apenas package.json
COPY package.json ./

# Instalar dependências (forçando rebuild de nativos)
RUN npm install

# Copiar o código fonte
COPY . .

# Expor a porta
EXPOSE 3001

# Iniciar
CMD ["node", "server.js"]
