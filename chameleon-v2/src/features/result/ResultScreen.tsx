import type { RunSummary } from '../../app/types'

type Props = {
  compact?: boolean
  summary: RunSummary
  resultCopy: string
  rank: number | null
  isGuest: boolean
  successNote: string
  onLogin: () => void
  onReplay: () => void
  onHome: () => void
}

export default function ResultScreen({
  compact = false,
  summary,
  resultCopy,
  rank,
  isGuest,
  successNote,
  onLogin,
  onReplay,
  onHome,
}: Props) {
  return (
    <main
      className={`app-shell${compact ? ' is-compact' : ''}`}
      data-layout={compact ? 'compact' : 'regular'}
    >
      <section className={`hero-card${compact ? ' is-compact' : ''}`}>
        <p className="eyebrow">结果页</p>
        <h1>本局战报</h1>
        <p className={`result-score${compact ? ' is-compact' : ''}`}>
          {summary.score} 分
        </p>
        <p className="hero-copy">{resultCopy}</p>
        <p className="body-copy">
          {isGuest
            ? '现在登录，立刻把这局成绩送上榜单。'
            : rank
              ? `当前排名 #${rank}`
              : '已登录，等待上榜反馈。'}
        </p>
        {successNote ? <p className="success-note">{successNote}</p> : null}
        <div className={`hero-actions${compact ? ' is-inline' : ''}`}>
          {isGuest ? (
            <button className="primary-button" type="button" onClick={onLogin}>
              登录后上榜
            </button>
          ) : null}
          <button className="secondary-button" type="button" onClick={onReplay}>
            再来一局
          </button>
          <button className="secondary-button" type="button" onClick={onHome}>
            返回首页
          </button>
        </div>
      </section>
    </main>
  )
}
