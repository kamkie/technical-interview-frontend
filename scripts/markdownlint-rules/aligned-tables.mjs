import { checkAlignedTables } from './markdown-format-utils.mjs'

export default {
  names: ['repo-aligned-tables'],
  description: 'Pipe tables must use deterministic alignment',
  tags: ['repo-markdown-format'],
  parser: 'none',
  function: (params, onError) => {
    for (const failure of checkAlignedTables(params.lines)) {
      onError(failure)
    }
  },
}
