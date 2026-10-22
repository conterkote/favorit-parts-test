import { useState } from 'react'
import { ArrowUpRight, Layers2 } from 'lucide-react'

export default function RootLayout({ children }) {
  const [keyboardNavigation, setKeyboardNavigation] = useState(true)

  return (
    <div
      className="app-shell"
      data-keyboard-navigation={keyboardNavigation}
      onPointerDownCapture={() => setKeyboardNavigation(false)}
      onKeyDownCapture={(event) => {
        if (event.key === 'Tab') setKeyboardNavigation(true)
      }}
    >
      <a className="skip-link" href="#main-content">
        Перейти к поиску
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="wordmark" href="/" aria-label="Partline — на главную">
            <span className="brand-symbol">
              <Layers2 size={21} strokeWidth={2} aria-hidden="true" />
            </span>
            PARTLINE<span className="wordmark-period">.</span>
          </a>
          <span className="header-divider" />
          <span className="header-caption">Каталог автозапчастей</span>
          <a
            className="button button--secondary resume-link"
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Резюме (PDF, в новой вкладке)"
          >
            Резюме
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </header>
      <main id="main-content" className="main-content">
        {children}
      </main>
      <footer className="site-footer">
        <div>
          <span className="footer-brand">PARTLINE.</span>
          <span>Цены и остатки по складам</span>
        </div>
        <a href="https://www.favorit-parts.ru/" target="_blank" rel="noreferrer">
          Данные Favorit Parts
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
    </div>
  )
}
