import type { LeaderboardEntry } from '../../app/types'

type Props = {
  entries: LeaderboardEntry[]
}

export default function LeaderboardPreview({ entries }: Props) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2>全服算力榜</h2>
        <span className="panel-tag">Mock</span>
      </div>
      <ol className="leaderboard-list">
        {entries.map((entry) => (
          <li key={entry.id} className="leaderboard-item">
            <strong>{entry.nickname}</strong>
            <span>{entry.score} 分</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
