import type { RunSummary } from '../../app/types'

type Props = {
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
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">结果页</p>
        <h1>本局战报</h1>
        <p className="result-score">{summary.score} 分</p>
        <p className="hero-copy">{resultCopy}</p>
        <p className="body-copy">
          {isGuest
            ? '现在登录，立刻把这局成绩送上榜单。'
            : rank
              ? `当前排名 #${rank}`
              : '已登录，等待上榜反馈。'}
        </p>
        {successNote ? <p className="success-note">{successNote}</p> : null}
        <div className="hero-actions">
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
