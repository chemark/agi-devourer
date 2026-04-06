import type { LeaderboardEntry, SessionState } from '../../app/types'
import LeaderboardPreview from './LeaderboardPreview'

type Props = {
  session: SessionState
  entries: LeaderboardEntry[]
  onStart: () => void
}

export default function HomeScreen({ session, entries, onStart }: Props) {
  const isGuest = session.status === 'guest'

  return (
    <div className="home-screen">
      <section className="hero-card">
        <p className="eyebrow">产品链路优先</p>
        <h1>舌尖上的 AGI</h1>
        <p className="hero-copy">游客可直接开玩，登录后才能上榜。</p>
        <p className="hero-copy">先用竖屏承接入口，再把双手操作交给横屏局内。</p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={onStart}>
            立即挑战
          </button>
          <button className="secondary-button" type="button">
            {isGuest ? '微信登录' : '微信已连接'}
          </button>
        </div>
      </section>

      <LeaderboardPreview entries={entries} />

      <section className="panel">
        <div className="panel-title-row">
          <h2>今日战报</h2>
        </div>
        <p className="body-copy">吞得越狠，结算页越会逼你登录冲榜。</p>
      </section>
    </div>
  )
}
