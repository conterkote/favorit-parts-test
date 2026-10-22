import { ArrowRight, Search, X } from 'lucide-react'
import { useAppSelector } from '@Store'
import { Button } from '@Ui/Button'

const examples = ['01089', '7160500039S', '0189']

export default function PartSearch({ inputRef, onSearch, onArticleChange }) {
  const article = useAppSelector((state) => state.parts.article)

  return (
    <section className="search-section" aria-label="Поиск по артикулу">
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch()
        }}
      >
        <label className="field-label" htmlFor="part-number">
          Артикул запчасти
        </label>
        <div className="search-controls">
          <div className="search-field">
            <Search className="search-input-icon" size={21} aria-hidden="true" />
            <input
              ref={inputRef}
              id="part-number"
              value={article}
              onChange={(event) => onArticleChange(event.target.value)}
              placeholder="Например, 01089"
              maxLength={80}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="search-hint"
            />
            {article && (
              <button
                className="icon-button"
                type="button"
                aria-label="Очистить артикул"
                onClick={() => {
                  onArticleChange('')
                  inputRef.current?.focus({ preventScroll: true })
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <Button
            className="search-submit"
            type="submit"
            aria-label="Найти деталь"
            disabled={!article.trim()}
          >
            <span className="search-submit-label">Найти деталь</span>
            <ArrowRight className="search-submit-arrow" size={18} aria-hidden="true" />
            <Search className="search-submit-icon" size={22} aria-hidden="true" />
          </Button>
        </div>
        <div className="search-examples" id="search-hint">
          <span>Попробуйте:</span>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => onArticleChange(example)}>
              {example}
            </button>
          ))}
        </div>
      </form>
    </section>
  )
}
