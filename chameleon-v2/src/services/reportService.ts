import type { RunSummary } from '../app/types'

function getTier(summary: RunSummary) {
  if (summary.score >= 1500) return '奇点突破'
  if (summary.score >= 1000) return '算力过载'
  return '胃袋热机'
}

export const reportService = {
  async buildResultCopy(summary: RunSummary): Promise<string> {
    const tier = getTier(summary)
    const defeated = summary.defeatedKinds.join('、') || '空气'
    return `${tier}：本局 ${summary.score} 分，吞下了 ${defeated}。`
  },
}
