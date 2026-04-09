import { useState } from 'react'

type Props = {
  compact?: boolean
  onSubmit: (nickname: string) => Promise<void>
  onClose: () => void
}

export default function LoginSheet({
  compact = false,
  onSubmit,
  onClose,
}: Props) {
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <div
      className={`sheet-backdrop${compact ? ' is-compact' : ''}`}
      role="presentation"
    >
      <section
        className={`sheet-card${compact ? ' is-compact' : ''}`}
        aria-label="Mock 微信登录"
        data-layout={compact ? 'compact' : 'regular'}
      >
        <p className="eyebrow">Mock 微信登录</p>
        <h2>登录后上榜</h2>
        <p className="body-copy">先完成这次 mock 登录，再把你刚刚那局成绩送上榜。</p>
        <label className={`input-group${compact ? ' is-compact' : ''}`}>
          <span>昵称</span>
          <input
            aria-label="昵称输入框"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="输入你想上榜的昵称"
          />
        </label>
        <div className={`hero-actions${compact ? ' is-inline' : ''}`}>
          <button
            className="primary-button"
            type="button"
            disabled={submitting || nickname.trim().length < 2}
            onClick={async () => {
              const trimmedNickname = nickname.trim()
              setSubmitting(true)

              try {
                await onSubmit(trimmedNickname)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            微信一键登录
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            稍后再说
          </button>
        </div>
      </section>
    </div>
  )
}
