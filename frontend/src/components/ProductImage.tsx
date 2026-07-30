import { useState } from 'react'
import { Icon } from './Icon'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  /** Load immediately instead of lazily — use for above-the-fold images. */
  eager?: boolean
}

/**
 * Renders a product image with a graceful, labelled placeholder when the source
 * is missing or fails to load. Always provides meaningful alt text.
 */
export function ProductImage({ src, alt, className, eager }: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className={`product-image ${className ?? ''}`.trim()}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="product-image-fallback" role="img" aria-label={alt}>
          <Icon name="image" size={34} />
        </div>
      )}
    </div>
  )
}
