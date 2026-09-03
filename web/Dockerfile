# Bomberman level editor — static SPA for Dokploy / Docker
# Build context MUST be the `web/` folder (not the Unity repo root).

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/level-editor/package.json ./apps/level-editor/
COPY shared/level-schema/package.json ./shared/level-schema/

RUN npm ci

COPY apps/level-editor ./apps/level-editor
COPY shared/level-schema ./shared/level-schema

RUN npm run build:editor

FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/level-editor/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
