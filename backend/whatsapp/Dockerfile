FROM node:18-alpine

# Definir ambiente como produção para economizar memória
ENV NODE_ENV=production

# Instalar dependências necessárias para compilação (se necessário) e git
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copiar apenas package.json
COPY package.json ./

# Instalar APENAS dependências de produção (mais leve, menos memória)
RUN npm install --production --no-audit

# Copiar o resto do código
COPY . .

# Expor porta 3001
EXPOSE 3001

# Iniciar servidor
CMD ["node", "server.js"]
