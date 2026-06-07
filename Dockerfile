# Usa imagem oficial do Node
FROM node:18

# Diretório de trabalho
WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o projeto
COPY . .

# Expõe a porta do backend
EXPOSE 3000

# Comando para rodar o servidor
CMD ["node", "backend/server.js"]