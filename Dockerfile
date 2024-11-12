FROM node:20.9.0-alpine

# Installer sqlite sans cache
RUN apk add --no-cache sqlite sqlite-libs bash

# Définir le répertoire de travail
WORKDIR /wamp64/www/project-api-main/

# Exposer le port 3000
EXPOSE 3000

COPY package.json .

RUN npm install

COPY server.js .

CMD ["npm","start"]