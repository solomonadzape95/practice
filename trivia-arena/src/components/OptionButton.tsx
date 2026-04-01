import { motion } from 'framer-motion'

export type OptionState =
  | 'idle'
  | 'dimmed'
  | 'selectedCorrect'
  | 'selectedWrong'
  | 'correctReveal'

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

export function OptionButton({
  label,
  index,
  state,
  disabled,
  onClick,
}: {
  label: string
  index: number
  state: OptionState
  disabled: boolean
  onClick: () => void
}) {
  const isIdle = state === 'idle'

  // -----------------------------------------------------------
  // Use inline styles for the post-answer states so we get real
  // saturated color — Tailwind fractional opacities on oklch are
  // too faint on dark backgrounds.
  // -----------------------------------------------------------
  type Cfg = {
    style?: React.CSSProperties
    cls: string
    textCls: string
    badgeStyle?: React.CSSProperties
    badgeCls: string
    marker: string
  }

  const cfg: Cfg = (() => {
    switch (state) {
      case 'selectedCorrect':
        return {
          style: { backgroundColor: 'rgba(0,212,164,0.22)', boxShadow: '0 0 0 2px rgba(0,212,164,0.55)' },
          cls: '',
          textCls: 'text-white',
          badgeStyle: { backgroundColor: '#00D4A4', color: '#0C0F1A' },
          badgeCls: '',
          marker: '✓',
        }
      case 'correctReveal':
        return {
          style: { backgroundColor: 'rgba(0,212,164,0.14)', boxShadow: '0 0 0 1.5px rgba(0,212,164,0.40)' },
          cls: '',
          textCls: 'text-[#00D4A4]',
          badgeStyle: { backgroundColor: '#00D4A4', color: '#0C0F1A' },
          badgeCls: '',
          marker: '✓',
        }
      case 'selectedWrong':
        return {
          style: { backgroundColor: 'rgba(255,63,94,0.22)', boxShadow: '0 0 0 2px rgba(255,63,94,0.55)' },
          cls: '',
          textCls: 'text-white',
          badgeStyle: { backgroundColor: '#FF3F5E', color: '#fff' },
          badgeCls: '',
          marker: '✗',
        }
      case 'dimmed':
        return {
          cls: 'bg-q-card/40',
          textCls: 'text-q-dim',
          badgeCls: 'bg-q-hover text-q-dim',
          marker: LABELS[index] ?? String(index + 1),
        }
      default: // idle
        return {
          cls: 'bg-q-card hover:bg-q-hover',
          textCls: 'text-q-text',
          badgeCls: 'bg-q-hover text-q-sub group-hover:bg-white/12 group-hover:text-q-text',
          marker: LABELS[index] ?? String(index + 1),
        }
    }
  })()

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={cfg.style}
      className={[
        'group relative w-full rounded-xl p-5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-q-purple',
        cfg.cls,
        isIdle ? 'cursor-pointer' : 'cursor-default',
      ].join(' ')}
      whileHover={isIdle ? { y: -2, scale: 1.01 } : undefined}
      whileTap={isIdle ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="flex items-center gap-4">
        <div
          style={cfg.badgeStyle}
          className={[
            'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold transition-all',
            cfg.badgeCls,
          ].join(' ')}
        >
          {cfg.marker}
        </div>
        <div className={['text-lg font-medium leading-snug', cfg.textCls].join(' ')}>
          {label}
        </div>
      </div>
    </motion.button>
  )
}
