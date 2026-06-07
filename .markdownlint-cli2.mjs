import alignedTables from './scripts/markdownlint-rules/aligned-tables.mjs'
import noHardWrappedProse from './scripts/markdownlint-rules/no-hard-wrapped-prose.mjs'

export default {
  globs: ['**/*.md'],
  gitignore: true,
  noBanner: true,
  noProgress: true,
  customRules: [alignedTables, noHardWrappedProse],
  config: {
    default: false,
    MD047: true,
    'repo-aligned-tables': true,
    'repo-no-hard-wrapped-prose': true,
  },
}
