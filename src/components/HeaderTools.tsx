import { Moon, Sun } from '@phosphor-icons/react'
import { useState } from 'react'
import { useI18n } from '../i18n'
import { applyTheme, getTheme } from '../theme'

/** Light/dark switch, shown at the top right of each main tab. */
export function HeaderTools() {
  const { t } = useI18n()
  const [theme, setTheme] = useState(getTheme)
  return (
    <div className="header-tools">
      <button
        type="button"
        className="icon-btn"
        aria-label={t.theme}
        onClick={() => {
          const next = theme === 'dark' ? 'light' : 'dark'
          applyTheme(next)
          setTheme(next)
        }}
      >
        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </div>
  )
}
