import type { Orientation } from '../../hooks/useOrientation'

type Props = {
  orientation: Orientation
  onConfirm: () => void
  onBack: () => void
}

export default function RotateScreen({ orientation, onConfirm, onBack }: Props) {
  const ready = orientation === 'landscape'

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">横屏准备页</p>
        <h1>准备横屏开局</h1>
        <p className="hero-copy">{ready ? '已经横屏，可以开始挑战。' : '请先横屏再开始'}</p>
        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            onClick={onConfirm}
            disabled={!ready}
          >
            开始挑战
          </button>
          <button className="secondary-button" type="button" onClick={onBack}>
            返回首页
          </button>
        </div>
      </section>
    </main>
  )
}
