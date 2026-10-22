import { useCallback, useLayoutEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@Store'
import {
  articleChanged,
  brandSelected,
  manufacturersOpened,
} from '@Store/Slices/partsSlice/partsSlice'
import { PartSearch, usePartSearch } from '@Features/PartSearch'
import { BrandPicker } from '@Features/BrandPicker'
import { CatalogNavigation } from '@Features/CatalogNavigation'
import { OffersTable } from '@Widgets/OffersTable'

export default function PartsPage() {
  const dispatch = useAppDispatch()
  const search = usePartSearch()
  const { stage, article, selectedBrand, manufacturers, offers } = useAppSelector(
    (state) => state.parts,
  )
  const searchInput = useRef(null)
  const workspace = useRef(null)
  const activeBrand = useRef(null)
  const offersPanel = useRef(null)
  const brandScroll = useRef(0)
  const navigation = useRef(null)
  const manufacturerRequest = useRef(null)
  const scrollAfterSearch = useRef(false)

  const scrollToWorkspace = useCallback((focusOffers = false) => {
    if (focusOffers) offersPanel.current?.focus({ preventScroll: true })

    workspace.current?.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }, [])

  useLayoutEffect(() => {
    const intent = navigation.current

    if (!intent) return

    if (intent === 'offers') {
      if (stage !== 'offers' || !selectedBrand) {
        navigation.current = null
        return
      }

      if (offers.status !== 'success' && offers.status !== 'error') return

      navigation.current = null
      scrollToWorkspace(true)
      return
    }

    navigation.current = null

    if (intent === 'manufacturer-results') {
      scrollToWorkspace()
      return
    }

    if (intent === 'manufacturers' && window.matchMedia('(max-width: 760px)').matches) {
      activeBrand.current?.focus({ preventScroll: true })
      window.scrollTo({ top: brandScroll.current, behavior: 'instant' })
    }

    if (intent === 'reset') {
      const input = searchInput.current

      if (!input) return

      input.focus({ preventScroll: true })
      input.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [stage, article, selectedBrand, offers.status, scrollToWorkspace])

  useLayoutEffect(() => {
    if (!article.trim()) {
      manufacturerRequest.current = null
      return
    }

    if (manufacturers.status === 'loading') {
      manufacturerRequest.current = manufacturers.requestId
      return
    }

    if (!manufacturerRequest.current) return

    manufacturerRequest.current = null

    if (!scrollAfterSearch.current) return

    scrollAfterSearch.current = false

    if (manufacturers.status !== 'success' && manufacturers.status !== 'error') return

    if (stage === 'manufacturers') scrollToWorkspace()
    else {
      navigation.current = 'manufacturer-results'
      dispatch(manufacturersOpened())
    }
  }, [article, stage, manufacturers.status, manufacturers.requestId, scrollToWorkspace, dispatch])

  function changeArticle(value) {
    navigation.current = null
    scrollAfterSearch.current = false

    if (value === article && value.trim()) search()
    else dispatch(articleChanged(value))
  }

  function submitSearch() {
    scrollAfterSearch.current = true
    search()
  }

  function selectBrand(brand) {
    scrollAfterSearch.current = false

    if (window.matchMedia('(max-width: 760px)').matches) brandScroll.current = window.scrollY

    if (stage === 'offers' && selectedBrand === brand) {
      if (offers.status === 'success' || offers.status === 'error') scrollToWorkspace(true)
      else navigation.current = 'offers'

      return
    }

    navigation.current = 'offers'
    dispatch(brandSelected(brand))
  }

  function openManufacturers() {
    scrollAfterSearch.current = false
    navigation.current = 'manufacturers'
    dispatch(manufacturersOpened())
  }

  function resetSearch() {
    navigation.current = 'reset'
    scrollAfterSearch.current = false
    brandScroll.current = 0
    dispatch(articleChanged(''))
  }

  return (
    <>
      <div className="page-intro">
        <h1>Поиск автозапчастей</h1>
        <p>Введите артикул и выберите производителя.</p>
      </div>
      <PartSearch inputRef={searchInput} onSearch={submitSearch} onArticleChange={changeArticle} />
      <div
        ref={workspace}
        className={`catalog-workspace catalog-workspace--${stage} ${article.trim() ? 'catalog-workspace--searched' : ''}`}
      >
        <CatalogNavigation onBack={openManufacturers} onReset={resetSearch} />
        <BrandPicker onSelect={selectBrand} onRetry={submitSearch} activeBrandRef={activeBrand} />
        <OffersTable panelRef={offersPanel} onFiltersChange={scrollToWorkspace} />
      </div>
    </>
  )
}
