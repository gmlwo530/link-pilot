FROM node:22-alpine

WORKDIR /app

COPY server ./server

EXPOSE 4312

CMD ["node", "server/src/index.js"]
