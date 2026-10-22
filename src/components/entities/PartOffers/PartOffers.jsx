import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { OfferRow } from '@Entities/OfferRow'
import { pluralize } from '@Utility/formatters'

export default function PartOffers({ group }) {
  const [expanded, setExpanded] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const detailsId = useId()
  const { primary, others } = group

  return (
    <article className={`part-offers ${expanded ? 'part-offers--expanded' : ''}`}>
      <OfferRow offer={primary}>
        {others.length > 0 && (
          <button
            type="button"
            className="warehouses-toggle"
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={`${expanded ? 'Скрыть' : 'Показать'} другие предложения ${primary.brand} ${primary.number}`}
            onClick={() => {
              setHasOpened(true)
              setExpanded((value) => !value)
            }}
          >
            <span>{expanded ? 'Скрыть другие склады' : 'Другие склады'}</span>
            <span className="warehouses-count">{others.length}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        )}
      </OfferRow>
      {others.length > 0 && (
        <div
          id={detailsId}
          className="warehouse-disclosure"
          inert={!expanded}
          aria-hidden={!expanded}
        >
          <div className="warehouse-disclosure-inner">
            {hasOpened && (
              <div className="warehouse-disclosure-content">
                <p className="warehouse-disclosure-title">
                  Ещё {others.length}{' '}
                  {pluralize(others.length, 'предложение', 'предложения', 'предложений')} этой
                  детали
                </p>
                {others.map((offer) => (
                  <OfferRow key={offer.id} offer={offer} showProduct={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
