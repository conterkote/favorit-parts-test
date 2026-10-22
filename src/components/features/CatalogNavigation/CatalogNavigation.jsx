import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useAppSelector } from '@Store'
import { Button } from '@Ui/Button'

export default function CatalogNavigation({ onBack, onReset }) {
  const { stage, article, searchedArticle, selectedBrand } = useAppSelector((state) => state.parts)
  const showingOffers = stage === 'offers'
  const number = searchedArticle || article.trim()
  const context = showingOffers && selectedBrand ? `${number} · ${selectedBrand}` : number

  if (!number) return null

  return (
    <nav
      className={`catalog-navigation ${showingOffers ? '' : 'catalog-navigation--manufacturers'}`}
      aria-label="Навигация по подбору"
    >
      {showingOffers && (
        <Button
          variant="text"
          onClick={onBack}
          aria-label="К производителям"
          title="К производителям"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Button>
      )}
      <div className="catalog-navigation-content">
        <span className="catalog-navigation-title">
          {showingOffers ? 'Предложения и аналоги' : 'Производители'}
        </span>
        <div className="catalog-context" title={context}>
          <span className="sr-only">Артикул </span>
          <strong className="catalog-article">{number}</strong>
          {showingOffers && selectedBrand && (
            <>
              <span className="catalog-context-divider" aria-hidden="true">
                ·
              </span>
              <span className="sr-only">Производитель </span>
              <span className="catalog-brand">{selectedBrand}</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="text"
        className="catalog-reset"
        onClick={onReset}
        aria-label="Новый поиск"
        title="Новый поиск"
      >
        <RotateCcw size={19} aria-hidden="true" />
      </Button>
    </nav>
  )
}
