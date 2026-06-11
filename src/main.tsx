import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { installApiDebugLogging } from './api/debugLogging'
import { I18nProvider } from './i18n/I18nProvider'
import './index.css'

if (import.meta.env.DEV) {
  installApiDebugLogging()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
