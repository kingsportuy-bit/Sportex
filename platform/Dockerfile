FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY core/package.json ./core/package.json
RUN npm ci --ignore-scripts

COPY core/tsconfig.json ./core/tsconfig.json
COPY core/src ./core/src
RUN npm --workspace @sportex/core run build

FROM node:22-alpine AS production-dependencies

WORKDIR /app
COPY package.json package-lock.json ./
COPY core/package.json ./core/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/core/dist ./core/dist
COPY --chown=node:node core/package.json ./core/package.json
COPY --chown=node:node frontend ./frontend

USER node
EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=4s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "core/dist/index.js"]
