import {
  createRollupAsset,
  normalizeOptions,
  Output,
  type Asset,
  type Chunk,
  type Module,
} from '@codecov/bundler-plugin-core'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import type { Plugin, ProxyOptions } from 'vite'
import { defineConfig } from 'vitest/config'
import { mockApiPlugin } from './src/mock-api/vite'

const apiProxy = {
  '^/api(?:$|/(?!.*\\.(?:ts|tsx|js|jsx|css|map)(?:\\?|$)).*)': {
    target: 'http://localhost:8080',
    changeOrigin: false,
  },
} satisfies Record<string, ProxyOptions>

function codecovBundleAnalysisPlugin(): Plugin | false {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return false
  }

  const normalizedOptions = normalizeOptions({
    bundleName: 'technical-interview-frontend',
    enableBundleAnalysis: true,
    gitService: 'github',
    oidc: {
      useGitHubOIDC: true,
    },
    telemetry: false,
  })

  if (!normalizedOptions.success) {
    throw new Error(`Invalid Codecov bundle analysis options: ${normalizedOptions.errors.join(' ')}`)
  }

  const output = new Output(normalizedOptions.options, { metaFramework: 'vite' })

  return {
    name: 'technical-interview-frontend-codecov-bundle-analysis',
    apply: 'build',
    buildStart() {
      output.start()
      output.setPlugin('technical-interview-frontend-codecov-bundle-analysis', '0.1.0')
    },
    buildEnd() {
      output.end()
    },
    async generateBundle(options, bundle) {
      output.setBundleName(output.originalBundleName)
      const format = options.format === 'es' ? 'esm' : options.format
      output.setBundleName(`${output.bundleName}-${format}`)

      const cwd = process.cwd()
      const assets: Asset[] = []
      const chunks: Chunk[] = []
      const moduleByFileName = new Map<string, Module>()
      const assetFormatString =
        typeof options.assetFileNames === 'string' ? options.assetFileNames : ''
      const chunkFormatString =
        typeof options.chunkFileNames === 'string' ? options.chunkFileNames : ''
      let chunkCounter = 0

      await Promise.all(
        Object.values(bundle).map(async (item) => {
          if (path.extname(item.fileName) === '.map') {
            return
          }

          if (item.type === 'asset') {
            assets.push(
              await createRollupAsset({
                fileName: item.fileName,
                source: item.source,
                formatString: assetFormatString,
                metaFramework: output.metaFramework,
              }),
            )
            return
          }

          assets.push(
            await createRollupAsset({
              fileName: item.fileName,
              source: item.code,
              formatString: chunkFormatString,
              metaFramework: output.metaFramework,
            }),
          )

          const uniqueId = `${chunkCounter}-${item.name}`
          chunks.push({
            id: item.name,
            uniqueId,
            entry: item.isEntry,
            initial: item.isDynamicEntry,
            files: [item.fileName],
            names: [item.name],
            dynamicImports: item.dynamicImports,
          })

          for (const [modulePath, moduleInfo] of Object.entries(item.modules)) {
            const normalizedModulePath = modulePath.replace('\0', '')
            const relativeModulePath = path.isAbsolute(normalizedModulePath)
              ? path.relative(cwd, normalizedModulePath)
              : normalizedModulePath
            const moduleName = relativeModulePath.startsWith('..')
              ? relativeModulePath
              : `.${path.sep}${relativeModulePath}`
            const moduleEntry = moduleByFileName.get(moduleName)

            if (moduleEntry) {
              moduleEntry.chunkUniqueIds.push(uniqueId)
            } else {
              moduleByFileName.set(moduleName, {
                name: moduleName,
                size: moduleInfo.renderedLength,
                chunkUniqueIds: [uniqueId],
              })
            }
          }

          chunkCounter += 1
        }),
      )

      output.bundler = {
        name: 'rolldown',
        version: (this.meta as { rolldownVersion?: string; rollupVersion?: string })
          .rolldownVersion ?? this.meta.rollupVersion,
      }
      output.assets = assets
      output.chunks = chunks
      output.modules = Array.from(moduleByFileName.values())
      output.outputPath = options.dir ?? ''
    },
    async writeBundle() {
      await output.write(true)
    },
  }
}

export default defineConfig(({ mode }) => {
  const mockApiEnabled = mode === 'mock'

  return {
    root: 'src',
    cacheDir: '../node_modules/.vite',
    plugins: [
      react(),
      mockApiEnabled && mockApiPlugin(process.env),
      codecovBundleAnalysisPlugin(),
    ],
    build: {
      emptyOutDir: true,
      outDir: '../dist',
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: mockApiEnabled ? undefined : apiProxy,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      proxy: mockApiEnabled ? undefined : apiProxy,
    },
    test: {
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: '../coverage',
        include: ['**/*.{ts,tsx}'],
        exclude: [
          '**/*.test.{ts,tsx}',
          '**/generated/**',
          '**/test/**',
          'main.tsx',
          'vite-env.d.ts',
        ],
      },
      environment: 'jsdom',
      setupFiles: './test/setup.ts',
    },
  }
})
