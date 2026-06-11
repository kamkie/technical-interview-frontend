import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dockerfilePath = resolve(repoRoot, 'Dockerfile')
const nginxTemplatePath = resolve(
  repoRoot,
  'docker/nginx/templates/default.conf.template',
)
const failures = []

async function main() {
  const [dockerfile, nginxTemplate] = await Promise.all([
    readFile(dockerfilePath, 'utf8'),
    readFile(nginxTemplatePath, 'utf8'),
  ])

  checkDockerfile(dockerfile)
  checkNginxTemplate(nginxTemplate)
  checkForbiddenAssumptions(dockerfile, 'Dockerfile')
  checkForbiddenAssumptions(
    nginxTemplate,
    'docker/nginx/templates/default.conf.template',
  )

  if (failures.length > 0) {
    console.error('M20 runtime/Nginx invariant check failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exitCode = 1
    return
  }

  console.log('M20 runtime/Nginx invariant check passed.')
}

function checkDockerfile(dockerfile) {
  const fromLines = dockerfile.match(/^FROM\s+\S+(?:\s+AS\s+\S+)?$/gim) ?? []
  const buildFrom = fromLines[0] ?? ''
  const finalFrom = fromLines.at(-1) ?? ''

  expect(
    /^FROM\s+node:24\b/i.test(buildFrom),
    'Dockerfile build stage must use the canonical Node.js 24 image',
  )
  expect(
    /^FROM\s+nginxinc\/nginx-unprivileged:/i.test(finalFrom),
    'Dockerfile final stage must use nginxinc/nginx-unprivileged',
  )
  expect(
    /^ENV\s+FRONTEND_API_UPSTREAM=/im.test(dockerfile),
    'Dockerfile must define FRONTEND_API_UPSTREAM for the runtime proxy',
  )
  expect(
    /^EXPOSE\s+8080\b/im.test(dockerfile),
    'Dockerfile must expose port 8080',
  )
  expect(
    /HEALTHCHECK[\s\S]*http:\/\/127\.0\.0\.1:8080\/healthz/im.test(dockerfile),
    'Dockerfile healthcheck must target /healthz on port 8080',
  )
  const userLines = dockerfile.match(/^USER\s+\S+/gim) ?? []
  const finalUser = userLines.at(-1) ?? ''
  expect(
    !/^USER\s+(?:root|0)\b/i.test(finalUser),
    'Dockerfile must not leave the runtime image running as root',
  )
}

function checkNginxTemplate(nginxTemplate) {
  expect(
    /^\s*listen\s+8080;/im.test(nginxTemplate),
    'Nginx template must listen on port 8080',
  )
  expect(
    /location\s+=\s+\/healthz\s*\{[\s\S]*?return\s+204;/im.test(nginxTemplate),
    'Nginx template must expose /healthz with a 204 response',
  )
  expect(
    /location\s+=\s+\/api\s*\{[\s\S]*?proxy_pass\s+\$\{FRONTEND_API_UPSTREAM\};/im.test(
      nginxTemplate,
    ),
    'Nginx template must proxy /api through FRONTEND_API_UPSTREAM',
  )
  expect(
    /location\s+\/api\/\s*\{[\s\S]*?proxy_pass\s+\$\{FRONTEND_API_UPSTREAM\};/im.test(
      nginxTemplate,
    ),
    'Nginx template must proxy /api/ through FRONTEND_API_UPSTREAM',
  )

  const proxyPassTargets = [
    ...nginxTemplate.matchAll(/proxy_pass\s+([^;]+);/gim),
  ].map((match) => match[1].trim())

  for (const target of proxyPassTargets) {
    expect(
      target === '${FRONTEND_API_UPSTREAM}',
      `Nginx proxy_pass must use FRONTEND_API_UPSTREAM, not ${target}`,
    )
  }
}

function checkForbiddenAssumptions(content, label) {
  const forbiddenPatterns = [
    ['CORS response headers', /\bAccess-Control-Allow-/i],
    ['CORS assumptions', /\bcors\b/i],
    ['JWT assumptions', /\bjwt\b/i],
    ['bearer-token assumptions', /\bbearer\b/i],
    ['Authorization header assumptions', /\bAuthorization\b/i],
    ['hard-coded OAuth provider paths', /\/(?:test-support\/)?oauth2\//i],
    ['provider metadata assumptions', /\bauthorizationPath\b|\bloginProviders\b/i],
  ]

  for (const [description, pattern] of forbiddenPatterns) {
    expect(!pattern.test(content), `${label} must not contain ${description}`)
  }
}

function expect(condition, message) {
  if (!condition) {
    failures.push(message)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
