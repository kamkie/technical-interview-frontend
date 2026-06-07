# Frontend Infrastructure References

This directory contains deployment references for the `technical-interview-frontend` production container. They mirror the sibling backend repository's shape, but stay frontend-specific:

- serve the Vite build through the unprivileged Nginx image on port `8080`
- expose the Kubernetes service on port `80`
- keep browser API traffic same-origin under `/api/**`
- configure the server-side backend target with `FRONTEND_API_UPSTREAM`
- avoid backend-only database, OAuth, actuator, and secret assumptions

## Layout

| Path                                 | Purpose                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `k8s/base/`                          | Kustomize base manifests for namespace, config, deployment, service, HPA, and PDB |
| `k8s/overlays/local/`                | Local Kustomize overlay for a locally tagged image and smaller resources          |
| `k8s/edge/`                          | Reference public ingress for the frontend host                                    |
| `helm/technical-interview-frontend/` | Helm chart equivalent of the base manifests                                       |

## Backend Upstream

The frontend container proxies `/api` and `/api/**` to `FRONTEND_API_UPSTREAM`. The default points at the sibling backend service:

```text
http://technical-interview-demo.technical-interview-demo.svc.cluster.local:80
```

Change this value in a deployment-owned overlay or Helm values file when the backend service name, namespace, or gateway differs. Do not switch browser code to CORS, JWT, bearer tokens, hard-coded provider paths, or non-`/api/**` endpoints.

## Render And Posture Checks

Run these checks when changing the manifests and the tools are available:

```powershell
kubectl kustomize infra/k8s/base
kubectl kustomize infra/k8s/overlays/local
helm template technical-interview-frontend infra/helm/technical-interview-frontend
helm template technical-interview-frontend infra/helm/technical-interview-frontend -f infra/helm/technical-interview-frontend/values-local.yaml
git diff --check
```

The selected M20 deployment posture check uses kube-linter against rendered Kustomize and Helm output. Use the command sequence in [`docs/LOCAL_DEVELOPMENT.md`](../docs/LOCAL_DEVELOPMENT.md) so rendered manifests stay under ignored scratch space and generated reports are not checked in during the advisory first pass.

These files are reference deployment assets, not a complete production runbook. Controller-specific TLS, WAF, rate limits, DNS, image promotion, and environment promotion belong in deployment-owned overlays or platform policy.
