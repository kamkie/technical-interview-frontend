# syntax=docker/dockerfile:1.23.0

FROM node:26-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN package_manager="$(node -p "require('./package.json').packageManager")" \
    && npm install -g "${package_manager}"
RUN npm ci

COPY eslint.config.js tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY docs/backend ./docs/backend
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:26b5d4920434bc4d8c17a68201488cf4b3d2391f0d25305cdfe66ccdc6d18aa4

# CVE-2026-45447: base image ships openssl 3.5.6-r0; remove the upgrade once a digest bump brings 3.5.7-r0.
USER root
RUN apk upgrade --no-cache libcrypto3 libssl3
USER nginx

ENV FRONTEND_API_UPSTREAM=http://host.docker.internal:8080

COPY docker/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
