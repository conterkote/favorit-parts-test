import { useEffect, useRef } from 'react'
import { ArrowRight, PackageSearch } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@Store'
import { fetchOffers } from '@Store/Slices/partsSlice/partsSlice'
import { Loader } from '@Ui/Loader'
import { StatusMessage } from '@Ui/StatusMessage'
import { OffersResults } from './ui/OffersResults'

export default function OffersTable({ panelRef, onFiltersChange }) {
  const dispatch = useAppDispatch()
  const { selectedBrand, searchedArticle, stage, offers } = useAppSelector((state) => state.parts)
  const request = useRef(null)

  useEffect(() => {
    if (stage === 'offers' && selectedBrand && searchedArticle)
      request.current = dispatch(fetchOffers({ number: searchedArticle, brand: selectedBrand }))

    return () => request.current?.abort()
  }, [dispatch, selectedBrand, searchedArticle, stage])

  const hasResults = Boolean(selectedBrand && offers.status === 'success' && offers.items.length)
  const heading = (
    <div className="section-heading">
      <span className={`step-number ${selectedBrand ? '' : 'step-number--muted'}`}>02</span>
      <h2 id="offers-title">Предложения и аналоги</h2>
      {selectedBrand && <span className="selected-brand">{selectedBrand}</span>}
    </div>
  )

  function retry() {
    request.current?.abort()
    request.current = dispatch(fetchOffers({ number: searchedArticle, brand: selectedBrand }))
  }

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className="offers-panel"
      aria-labelledby="offers-title"
      aria-busy={offers.status === 'loading'}
    >
      {!hasResults && <div className="offers-header offers-header--empty">{heading}</div>}
      {!selectedBrand && (
        <div className="empty-workspace">
          <div className="empty-icon">
            <PackageSearch size={38} strokeWidth={1.2} aria-hidden="true" />
          </div>
          <h3>Начните с артикула</h3>
          <p>
            Введите номер запчасти и выберите производителя.
            <br />
            Здесь появятся цены, остатки и доступные аналоги.
          </p>
          <div className="empty-steps">
            <span>Артикул</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>Производители</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>Предложения</span>
          </div>
        </div>
      )}
      {selectedBrand && (offers.status === 'loading' || offers.status === 'idle') && (
        <div className="offers-loading">
          <Loader label={`Получаем предложения ${selectedBrand}…`} />
          <div className="skeleton-table" aria-hidden="true">
            {[0, 1, 2, 3].map((row) => (
              <div key={row}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedBrand && offers.status === 'error' && (
        <StatusMessage
          error
          title="Не удалось загрузить предложения"
          description={offers.error}
          onRetry={retry}
        />
      )}
      {selectedBrand && offers.status === 'success' && !offers.items.length && (
        <StatusMessage
          title="Предложения не найдены"
          description="Попробуйте выбрать другого производителя или изменить артикул."
        />
      )}
      {hasResults && (
        <OffersResults
          key={`${searchedArticle}:${selectedBrand}`}
          items={offers.items}
          heading={heading}
          onFiltersChange={onFiltersChange}
        />
      )}
    </section>
  )
}
