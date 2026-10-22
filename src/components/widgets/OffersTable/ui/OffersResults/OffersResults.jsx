import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownUp, ArrowRight, ListFilter } from 'lucide-react'
import { groupOffers, offerSortOptions, PartOffers } from '@Entities/PartOffers'
import { Button } from '@Ui/Button'
import { pluralize } from '@Utility/formatters'

const PAGE_SIZE = 20

export default function OffersResults({ items, heading, onFiltersChange }) {
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('price-asc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [sortField, sortDirection] = sort.split('-')
  const reverseSortValue = `${sortField}-${sortDirection === 'asc' ? 'desc' : 'asc'}`
  const reverseSortLabel = offerSortOptions.find(
    (option) => option.value === reverseSortValue,
  ).label
  const scrollAfterFilter = useRef(false)
  const loadMoreTrigger = useRef(null)
  const waitForListStart = useRef(false)
  const manualLoading = useRef(false)

  const groups = useMemo(() => groupOffers(items, sort, inStock), [items, sort, inStock])
  const requested = groups.filter((group) => !group.primary.isAnalogue)
  const analogues = groups.filter((group) => group.primary.isAnalogue)
  const productCount = groups.length
  const offerCount = groups.reduce((count, group) => count + group.offerCount, 0)
  const sections = [
    { key: 'requested', title: 'Искомая деталь', groups: requested },
    { key: 'analogues', title: 'Аналоги', groups: analogues.slice(0, visibleCount) },
  ]

  useLayoutEffect(() => {
    if (!scrollAfterFilter.current) return

    scrollAfterFilter.current = false
    waitForListStart.current = true
    onFiltersChange()
  }, [inStock, sort, onFiltersChange])

  useEffect(() => {
    const target = loadMoreTrigger.current

    if (!target || visibleCount >= analogues.length || typeof IntersectionObserver === 'undefined')
      return

    const preloadDistance = Math.min(640, Math.max(240, Math.round(window.innerHeight * 0.75)))
    let active = true

    const observer = new IntersectionObserver(
      (entries) => {
        if (!active) return

        if (!entries.some((entry) => entry.isIntersecting)) {
          waitForListStart.current = false
          return
        }

        if (waitForListStart.current || manualLoading.current) return

        active = false
        observer.disconnect()
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, analogues.length))
      },
      { rootMargin: `0px 0px ${preloadDistance}px 0px`, threshold: 0 },
    )

    observer.observe(target)

    return () => {
      active = false
      observer.disconnect()
    }
  }, [visibleCount, analogues.length, inStock, sort])

  function changeStock(value) {
    if (value === inStock) return

    scrollAfterFilter.current = true
    setInStock(value)
    setVisibleCount(PAGE_SIZE)
  }

  function changeSort(value) {
    if (value === sort || !offerSortOptions.some((option) => option.value === value)) return

    scrollAfterFilter.current = true
    setSort(value)
    setVisibleCount(PAGE_SIZE)
  }

  const summary = (
    <div className="results-summary" role="status" aria-atomic="true">
      <span>
        {productCount} {pluralize(productCount, 'деталь', 'детали', 'деталей')}
        <span className="summary-dot">·</span>
        {offerCount} {pluralize(offerCount, 'предложение', 'предложения', 'предложений')}
      </span>
    </div>
  )

  return (
    <>
      <div className="offers-header">
        {heading}
        <div className="results-summary-desktop">{summary}</div>
        <div className="table-toolbar">
          <label className="stock-filter">
            <ListFilter size={16} aria-hidden="true" />
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) => changeStock(event.target.checked)}
            />
            Только в наличии
          </label>
          <div className="sort-control">
            <button
              type="button"
              className="sort-direction"
              aria-label={reverseSortLabel}
              title={reverseSortLabel}
              onClick={() => changeSort(reverseSortValue)}
            >
              <ArrowDownUp size={15} aria-hidden="true" />
            </button>
            <select
              aria-label="Сортировка предложений"
              value={sort}
              onChange={(event) => changeSort(event.target.value)}
            >
              {offerSortOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="results-summary-mobile">{summary}</div>
      {sections.map((section) => (
        <section
          key={section.key}
          className={`offer-section offer-section--${section.key}`}
          aria-label={section.title}
        >
          <div className="offer-section-heading">
            <h3>{section.title}</h3>
            {section.key === 'analogues' && <span>{analogues.length}</span>}
          </div>
          {section.groups.length > 0 ? (
            <>
              <div className="offers-columns" aria-hidden="true">
                <span>Деталь / Производитель</span>
                <span>Склад и отправка</span>
                <span className="numeric">Остаток</span>
                <span className="numeric">Цена за шт.</span>
              </div>
              {section.groups.map((group) => (
                <PartOffers key={group.productId} group={group} />
              ))}
            </>
          ) : (
            <div className="section-empty">
              <p>
                {section.key === 'requested'
                  ? inStock
                    ? 'Для искомой детали нет предложений с подтверждённым остатком.'
                    : 'Искомой детали нет в продаже'
                  : inStock
                    ? 'Нет аналогов с подтверждённым остатком.'
                    : 'Сервис не вернул аналоги этой детали.'}
              </p>
              {inStock && (
                <button type="button" className="inline-action" onClick={() => changeStock(false)}>
                  Показать без фильтра наличия
                </button>
              )}
            </div>
          )}
          {section.key === 'analogues' && analogues.length > 0 && (
            <div ref={loadMoreTrigger} className="table-footer">
              <span role="status" aria-live="polite" aria-atomic="true">
                Показано {Math.min(visibleCount, analogues.length)} из {analogues.length}
              </span>
              {visibleCount < analogues.length && (
                <Button
                  variant="secondary"
                  onFocus={() => {
                    manualLoading.current = true
                  }}
                  onBlur={() => {
                    manualLoading.current = false
                  }}
                  onClick={() =>
                    setVisibleCount((count) => Math.min(count + PAGE_SIZE, analogues.length))
                  }
                >
                  Показать ещё аналоги
                  <ArrowRight size={15} aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        </section>
      ))}
    </>
  )
}
