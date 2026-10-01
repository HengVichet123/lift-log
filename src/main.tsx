import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/noto-sans-khmer/khmer-400.css'
import '@fontsource/noto-sans-khmer/khmer-600.css'
import './index.css'
import App from './App.tsx'
import { seedIfEmpty } from './defaults'
import { I18nProvider } from './i18n'
import { applyTheme, getTheme } from './theme'

applyTheme(getTheme())

seedIfEmpty().finally(() =>
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
  ),
)
