import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react'
import { useAppSelector } from '@Store'
import { Loader } from '@Ui/Loader'
import { StatusMessage } from '@Ui/StatusMessage'

export default function BrandPicker({ onSelect, onRetry, activeBrandRef }) {
  const { article, searchedArticle, selectedBrand, manufacturers } = useAppSelector(
    (state) => state.parts,
  )
  const { items, status, error } = manufacturers

  return (
    <aside
      className="brand-panel"
      aria-labelledby="manufacturers-title"
      aria-busy={status === 'loading'}
    >
      <div className="section-heading">
        <span className="step-number">01</span>
        <h2 id="manufacturers-title">Производители</h2>
        {items.length > 0 && (
          <span className="count-badge" role="status">
            {status === 'loading' ? (
              <>
                <LoaderCircle className="spin" size={14} aria-hidden="true" />
                <span className="sr-only">Обновляем производителей…</span>
              </>
            ) : (
              items.length
            )}
          </span>
        )}
      </div>
      {status === 'idle' && (
        <p className="panel-hint">
          {article.trim() ? 'Готовим поиск…' : 'Введите артикул, чтобы увидеть производителей.'}
        </p>
      )}
      {status === 'loading' && !items.length && <Loader label="Ищем производителей…" />}
      {status === 'error' && (
        <StatusMessage error title="Поиск не выполнен" description={error} onRetry={onRetry} />
      )}
      {status === 'success' && !items.length && (
        <StatusMessage
          title="Ничего не найдено"
          description={`Проверьте артикул «${searchedArticle}» или попробуйте другой.`}
        />
      )}
      {items.length > 0 && (
        <>
          <p className="panel-hint">Выберите бренд для поиска аналогов и предложений.</p>
          <ul className="brand-list" aria-label="Производители">
            {items.map((item) => (
              <li key={item.brand}>
                <button
                  ref={selectedBrand === item.brand ? activeBrandRef : null}
                  type="button"
                  className={`brand-option ${selectedBrand === item.brand ? 'brand-option--selected' : ''}`}
                  aria-pressed={selectedBrand === item.brand}
                  onClick={() => onSelect(item.brand)}
                >
                  <span>
                    <span className="brand-name">{item.brand}</span>
                    <span className="brand-description">{item.name}</span>
                  </span>
                  {selectedBrand === item.brand ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={17} aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}
