import { useState, useEffect } from 'react'
import { Expand, X } from 'lucide-react'

interface Props {
  src: string
  alt?: string
  /** 'thumb' = small (e.g. table), 'card' = medium card, 'preview' = form preview size */
  variant?: 'thumb' | 'card' | 'preview'
}

export function ScreenshotView({ src, alt = 'Screenshot', variant = 'card' }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && setLightboxOpen(false)
    document.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

  return (
    <>
      <button
        type="button"
        className={`screenshot-view screenshot-view--${variant}`}
        onClick={() => setLightboxOpen(true)}
        aria-label="View screenshot full size"
      >
        <span className="screenshot-view__frame">
          <img src={src} alt={alt} className="screenshot-view__img" />
          <span className="screenshot-view__expand">
            <Expand size={variant === 'thumb' ? 16 : 24} strokeWidth={2} />
          </span>
        </span>
      </button>

      {lightboxOpen && (
        <div
          className="screenshot-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot full size"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="screenshot-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X size={28} />
          </button>
          <div className="screenshot-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt} className="screenshot-lightbox__img" />
          </div>
        </div>
      )}
    </>
  )
}
