import { formatCount, formatPrice, formatShipment } from '@Utility/formatters'

export default function OfferRow({ offer, showProduct = true, children }) {
  const shipment = formatShipment(offer.shipment)
  const hasActions = showProduct && Boolean(children)

  return (
    <div
      className={`offer-row ${showProduct ? '' : 'offer-row--warehouse'} ${hasActions ? 'offer-row--with-actions' : ''}`}
    >
      {showProduct && (
        <div className="offer-product">
          <h4 className="product-heading">
            <span className="product-brand">{offer.brand}</span>
            <span className="product-number">{offer.number}</span>
          </h4>
          <div className="product-name">{offer.name}</div>
        </div>
      )}
      <div className="offer-warehouse">
        <span className="mobile-cell-label">Склад</span>
        <span className="warehouse-name">{offer.warehouse}</span>
        <span className="cell-note">
          {shipment ? `Отправят со склада: ${shipment}` : 'Дата отправки не указана'}
        </span>
      </div>
      <div className="offer-stock numeric">
        <span className="mobile-cell-label">Остаток</span>
        <span className={(offer.stock ?? 0) > 0 ? 'stock-available' : 'stock-unavailable'}>
          {formatCount(offer.stock)}
        </span>
      </div>
      <div className={`offer-price numeric price ${offer.price === null ? 'price--missing' : ''}`}>
        <span className="mobile-cell-label">Цена за шт.</span>
        {formatPrice(offer.price)}
      </div>
      {hasActions && <div className="offer-actions">{children}</div>}
    </div>
  )
}
