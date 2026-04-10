import React, { ImgHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { buildEditorialFallbackImage, buildPlaceholderImage, PlaceholderStyle } from '../data/placeholders';
import { ImageStorageService } from '../services/imageStorageService';

interface CatalogImageFallback {
  category?: string;
  gender?: string;
  style?: PlaceholderStyle;
  seed?: string | number;
  label?: string;
}

interface CatalogImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: CatalogImageFallback;
}

const sanitizeSource = (value?: string | null) => (typeof value === 'string' ? value.trim() : '');

export const CatalogImage = ({
  src,
  alt,
  fallback,
  loading = 'lazy',
  decoding = 'async',
  referrerPolicy = 'no-referrer',
  className,
  onLoad,
  onError,
  ...props
}: CatalogImageProps) => {
  const source = sanitizeSource(src);

  const fallbackSource = useMemo(
    () =>
      buildPlaceholderImage({
        category: fallback?.category,
        gender: fallback?.gender,
        style: fallback?.style || 'editorial',
        seed: fallback?.seed || alt || 'catalog-image',
        label: fallback?.label || 'Imagem indisponivel',
        subtitle: 'Preview temporario'
      }),
    [fallback?.category, fallback?.gender, fallback?.label, fallback?.seed, fallback?.style, alt]
  );
  const hardFallbackSource = useMemo(
    () =>
      buildEditorialFallbackImage({
        category: fallback?.category,
        gender: fallback?.gender,
        seed: fallback?.seed || alt || 'catalog-image-hard-fallback',
        label: fallback?.label || 'Imagem indisponivel'
      }),
    [fallback?.category, fallback?.gender, fallback?.label, fallback?.seed, alt]
  );

  const [resolvedSource, setResolvedSource] = useState(
    source && !ImageStorageService.isLocalRef(source) ? source : fallbackSource
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResolvingLocalRef, setIsResolvingLocalRef] = useState(false);
  const isFallbackSource = resolvedSource === fallbackSource || resolvedSource === hardFallbackSource;

  useEffect(() => {
    let isMounted = true;
    setIsLoaded(false);

    if (!source) {
      setResolvedSource(fallbackSource);
      setIsResolvingLocalRef(false);
      return () => {
        isMounted = false;
      };
    }

    if (ImageStorageService.isLocalRef(source)) {
      setIsResolvingLocalRef(true);

      ImageStorageService.resolveRefToObjectUrl(source)
        .then((objectUrl) => {
          if (!isMounted) {
            return;
          }

          setResolvedSource(objectUrl || fallbackSource);
        })
        .catch((error) => {
          console.error('Falha ao resolver imagem local', error);
          if (isMounted) {
            setResolvedSource(fallbackSource);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsResolvingLocalRef(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }

    setResolvedSource(source);
    setIsResolvingLocalRef(false);

    return () => {
      isMounted = false;
    };
  }, [source, fallbackSource]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (resolvedSource !== fallbackSource) {
      setIsLoaded(false);
      setResolvedSource(fallbackSource);
    } else if (resolvedSource !== hardFallbackSource) {
      setIsLoaded(false);
      setResolvedSource(hardFallbackSource);
    } else {
      // Avoid permanent transparent state if even the hard fallback fails for any reason.
      setIsLoaded(true);
    }

    onError?.(event);
  };

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  return (
    <img
      {...props}
      src={resolvedSource}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy={referrerPolicy}
      className={`${className || ''} transition-opacity duration-500 ${
        isResolvingLocalRef || (!isLoaded && !isFallbackSource) ? 'opacity-0' : 'opacity-100'
      }`}
      onLoad={handleLoad}
      onError={handleError}
      data-placeholder-active={resolvedSource === fallbackSource ? 'true' : 'false'}
    />
  );
};
