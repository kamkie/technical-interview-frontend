# syntax=docker/dockerfile:1.23.0

FROM node:26-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN package_manager="$(node -p "require('./package.json').packageManager")" \
    && npm install -g "${package_manager}"
RUN npm ci

COPY eslint.config.js tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine

ENV FRONTEND_API_UPSTREAM=http://host.docker.internal:8080

COPY docker/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
