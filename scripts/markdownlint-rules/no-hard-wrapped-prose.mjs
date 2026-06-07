import { checkHardWraps } from './markdown-format-utils.mjs'

export default {
  names: ['repo-no-hard-wrapped-prose'],
  description: 'Paragraph and list-item prose must stay on one physical line',
  tags: ['repo-markdown-format'],
  parser: 'none',
  function: (params, onError) => {
    for (const failure of checkHardWraps(params.lines)) {
      onError(failure)
    }
  },
}
