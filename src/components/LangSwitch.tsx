import { useI18n } from '../i18n'

export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="lang" role="group" aria-label={t.language}>
      <button type="button" aria-pressed={lang === 'km'} onClick={() => setLang('km')} lang="km">
        ខ្មែរ
      </button>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">
        EN
      </button>
    </div>
  )
}
