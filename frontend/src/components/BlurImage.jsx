import React, { useState, useEffect, useRef } from 'react';

/**
 * BlurImage Component
 * Provides progressive blur-up image loading with a smooth shimmer effect.
 * Eliminates black box / jarring pop-in while images load over the network.
 */
export default function BlurImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  fallbackSrc = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Generate low-quality blurred preview URL if from Unsplash
  const getLowResUrl = (url) => {
    if (!url) return null;
    if (url.includes('images.unsplash.com')) {
      // Create a micro 40px compressed thumbnail with Gaussian blur
      const base = url.split('?')[0];
      return `${base}?auto=format&fit=crop&w=40&q=20&blur=30`;
    }
    return url;
  };

  const lowResUrl = getLowResUrl(src);
  const actualSrc = hasError ? fallbackSrc : (src || fallbackSrc);

  useEffect(() => {
    // Check if the image is already cached/complete
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-900/80 ${wrapperClassName}`}>
      {/* Blurred Low-Res Background Placeholder */}
      {!isLoaded && lowResUrl && (
        <img
          src={lowResUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-125 opacity-70 transition-opacity duration-700 pointer-events-none"
        />
      )}

      {/* Shimmer Light Sweep while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 image-blur-shimmer pointer-events-none" />
      )}

      {/* Main Full-Resolution Image with progressive unblur transition */}
      <img
        ref={imgRef}
        src={actualSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full transition-all duration-700 ease-out ${
          isLoaded
            ? 'filter-none opacity-100 scale-100'
            : 'filter blur-lg opacity-40 scale-105'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
