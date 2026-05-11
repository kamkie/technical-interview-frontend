import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contractPath = resolve(repoRoot, 'docs/backend/approved-openapi.json')
const outputPath = resolve(repoRoot, 'src/api/generated/openapi.ts')
const checkOnly = process.argv.includes('--check')
const httpMethods = new Set([
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
])
const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/

async function main() {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'))
  const generated = renderContractTypes(contract)

  if (checkOnly) {
    const current = await readFile(outputPath, 'utf8').catch(() => undefined)

    if (current !== generated) {
      console.error(
        `${relative(repoRoot, outputPath)} is stale. Run npm run api:types.`,
      )
      process.exitCode = 1
      return
    }

    console.log(`${relative(repoRoot, outputPath)} matches the backend contract.`)
    return
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, generated, 'utf8')
  console.log(`Generated ${relative(repoRoot, outputPath)}.`)
}

function renderContractTypes(contract) {
  const schemas = contract.components?.schemas ?? {}
  const paths = contract.paths ?? {}
  const operationEntries = collectOperations(paths)
  const lines = [
    '// Generated from docs/backend/approved-openapi.json.',
    '// Run `npm run api:types` to update this file.',
    '// Do not edit by hand.',
    '',
    'export interface components {',
    '  schemas: {',
  ]

  for (const [schemaName, schema] of Object.entries(schemas)) {
    lines.push(`    ${propertyKey(schemaName)}: ${schemaToType(schema, 4)};`)
  }

  lines.push('  }', '}', '', 'export interface operations {')

  for (const { operation, operationId, pathItem } of operationEntries) {
    lines.push(`  ${propertyKey(operationId)}: ${renderOperation(operation, pathItem, 2)};`)
  }

  lines.push('}', '', 'export interface paths {')

  for (const [path, pathItem] of Object.entries(paths)) {
    lines.push(`  ${propertyKey(path)}: {`)

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) {
        continue
      }

      lines.push(`    ${method}: operations[${stringLiteral(operation.operationId)}];`)
    }

    lines.push('  };')
  }

  lines.push(
    '}',
    '',
    'export type ApiPath = keyof paths',
    'export type ApiOperationId = keyof operations',
    '',
  )

  return `${lines.join('\n')}`
}

function collectOperations(paths) {
  const operations = []
  const operationIds = new Set()

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) {
        continue
      }

      if (!operation.operationId) {
        throw new Error(`Missing operationId for ${method.toUpperCase()} ${path}`)
      }

      if (operationIds.has(operation.operationId)) {
        throw new Error(`Duplicate operationId: ${operation.operationId}`)
      }

      operationIds.add(operation.operationId)
      operations.push({ method, operation, operationId: operation.operationId, pathItem })
    }
  }

  return operations
}

function renderOperation(operation, pathItem, propertyIndent) {
  const parameters = [
    ...(pathItem.parameters ?? []),
    ...(operation.parameters ?? []),
  ]
  const lines = [
    '{',
    renderParameters(parameters, propertyIndent + 2),
    renderRequestBody(operation.requestBody, propertyIndent + 2),
    renderResponses(operation.responses ?? {}, propertyIndent + 2),
    `${indent(propertyIndent)}}`,
  ]

  return lines.join('\n')
}

function renderParameters(parameters, propertyIndent) {
  if (parameters.length === 0) {
    return `${indent(propertyIndent)}parameters?: never;`
  }

  const grouped = new Map()

  for (const parameter of parameters) {
    const location = parameter.in ?? 'query'

    if (!grouped.has(location)) {
      grouped.set(location, [])
    }

    grouped.get(location).push(parameter)
  }

  const groupOrder = ['path', 'query', 'header', 'cookie']
  const hasRequiredParameter = parameters.some((parameter) => parameter.required)
  const lines = [
    `${indent(propertyIndent)}parameters${hasRequiredParameter ? '' : '?'}: {`,
  ]

  for (const location of groupOrder) {
    const group = grouped.get(location)

    if (!group) {
      continue
    }

    const hasRequiredGroupParameter = group.some((parameter) => parameter.required)
    lines.push(
      `${indent(propertyIndent + 2)}${propertyKey(location)}${
        hasRequiredGroupParameter ? '' : '?'
      }: ${renderParameterGroup(group, propertyIndent + 2)};`,
    )
  }

  lines.push(`${indent(propertyIndent)}};`)
  return lines.join('\n')
}

function renderParameterGroup(parameters, propertyIndent) {
  const lines = ['{']

  for (const parameter of parameters) {
    const parameterType = schemaToType(parameter.schema ?? { type: 'string' }, propertyIndent + 2)
    lines.push(
      `${indent(propertyIndent + 2)}${propertyKey(parameter.name)}${
        parameter.required ? '' : '?'
      }: ${parameterType};`,
    )
  }

  lines.push(`${indent(propertyIndent)}}`)
  return lines.join('\n')
}

function renderRequestBody(requestBody, propertyIndent) {
  if (!requestBody) {
    return `${indent(propertyIndent)}requestBody?: never;`
  }

  return [
    `${indent(propertyIndent)}requestBody: {`,
    `${indent(propertyIndent + 2)}content: ${renderContent(requestBody.content ?? {}, propertyIndent + 2)};`,
    `${indent(propertyIndent)}};`,
  ].join('\n')
}

function renderResponses(responses, propertyIndent) {
  const lines = [`${indent(propertyIndent)}responses: {`]

  for (const [statusCode, response] of Object.entries(responses)) {
    lines.push(
      `${indent(propertyIndent + 2)}${propertyKey(statusCode)}: ${renderResponse(response, propertyIndent + 2)};`,
    )
  }

  lines.push(`${indent(propertyIndent)}};`)
  return lines.join('\n')
}

function renderResponse(response, propertyIndent) {
  const content = response.content ?? {}

  if (Object.keys(content).length === 0) {
    return '{ content?: never }'
  }

  return [
    '{',
    `${indent(propertyIndent + 2)}content: ${renderContent(content, propertyIndent + 2)};`,
    `${indent(propertyIndent)}}`,
  ].join('\n')
}

function renderContent(content, propertyIndent) {
  const entries = Object.entries(content)

  if (entries.length === 0) {
    return 'Record<string, never>'
  }

  const lines = ['{']

  for (const [contentType, mediaType] of entries) {
    lines.push(
      `${indent(propertyIndent + 2)}${propertyKey(contentType)}: ${schemaToType(
        mediaType.schema ?? {},
        propertyIndent + 2,
      )};`,
    )
  }

  lines.push(`${indent(propertyIndent)}}`)
  return lines.join('\n')
}

function schemaToType(schema, propertyIndent) {
  if (schema.$ref) {
    return schemaRefToType(schema.$ref)
  }

  if (schema.oneOf || schema.anyOf || schema.allOf) {
    throw new Error('oneOf, anyOf, and allOf schemas are not supported yet.')
  }

  if (schema.enum) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ')
  }

  if (schema.type === 'array') {
    const itemType = schemaToType(schema.items ?? {}, propertyIndent)

    if (itemType.includes('\n') || itemType.includes(' | ')) {
      return `Array<${itemType}>`
    }

    return `${itemType}[]`
  }

  if (schema.type === 'object' || schema.properties || schema.additionalProperties) {
    return objectSchemaToType(schema, propertyIndent)
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return 'number'
  }

  if (schema.type === 'string') {
    return 'string'
  }

  if (schema.type === 'boolean') {
    return 'boolean'
  }

  if (schema.type === 'null') {
    return 'null'
  }

  return 'unknown'
}

function objectSchemaToType(schema, propertyIndent) {
  const properties = Object.entries(schema.properties ?? {})
  const required = new Set(schema.required ?? [])
  const additionalProperties = schema.additionalProperties

  if (properties.length === 0) {
    if (additionalProperties && additionalProperties !== true) {
      return `Record<string, ${schemaToType(additionalProperties, propertyIndent)}>`
    }

    return 'Record<string, unknown>'
  }

  const lines = ['{']

  for (const [propertyName, propertySchema] of properties) {
    lines.push(
      `${indent(propertyIndent + 2)}${propertyKey(propertyName)}${
        required.has(propertyName) ? '' : '?'
      }: ${schemaToType(propertySchema, propertyIndent + 2)};`,
    )
  }

  if (additionalProperties) {
    const valueType =
      additionalProperties === true
        ? 'unknown'
        : schemaToType(additionalProperties, propertyIndent + 2)
    lines.push(`${indent(propertyIndent + 2)}[key: string]: ${valueType};`)
  }

  lines.push(`${indent(propertyIndent)}}`)
  return lines.join('\n')
}

function schemaRefToType(ref) {
  const schemaPrefix = '#/components/schemas/'

  if (!ref.startsWith(schemaPrefix)) {
    throw new Error(`Unsupported schema reference: ${ref}`)
  }

  return `components['schemas'][${stringLiteral(ref.slice(schemaPrefix.length))}]`
}

function propertyKey(key) {
  return identifierPattern.test(key) ? key : stringLiteral(key)
}

function stringLiteral(value) {
  return JSON.stringify(value)
}

function indent(size) {
  return ' '.repeat(size)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
