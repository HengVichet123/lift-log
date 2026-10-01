import { ArrowLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

interface Props {
  title: ReactNode
  onBack?: () => void
  right?: ReactNode
}

export function ScreenHeader({ title, onBack, right }: Props) {
  const { t } = useI18n()
  return (
    <header className="screen-header">
      {onBack && (
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t.back}>
          <ArrowLeft size={26} weight="bold" />
        </button>
      )}
      <h1 className="screen-title">{title}</h1>
      {right}
    </header>
  )
}
