# Public Frontend Edge Reference

This directory contains a minimal ingress reference for serving the first-party UI.

## What it shows

- route the shared public host to `Service/technical-interview-frontend`
- keep browser API requests same-origin under `/api/**`
- use the same host as the sibling backend public `/api` edge, when that edge owns direct API routing
- leave vendor-specific TLS, WAF, auth challenge, and rate-limit controls to deployment-owned overlays

## API Routing

The frontend container can proxy `/api/**` to `FRONTEND_API_UPSTREAM`. A platform may also route `/api/**` directly to the backend service with the sibling backend's public API ingress. In both cases, browser code must keep using relative `/api/**` paths and must not depend on CORS or bearer-token authentication.

## Files

- `public-frontend-ingress.yaml` exposes the frontend service for the shared host
