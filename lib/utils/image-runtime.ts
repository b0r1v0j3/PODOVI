const OPTIMIZABLE_REMOTE_IMAGE_HOSTS = new Set([
  'cdn.gerflor.com',
  'media.tarkett-image.com',
  'nnjmrfwepylrheykalik.supabase.co',
  'podovi.online',
  'www.alpod.rs',
  'www.podovi.online',
]);

export function isLocalImageSrc(src: string) {
  return src.startsWith('/');
}

export function isOptimizableImageSrc(src: string) {
  if (!src) {
    return false;
  }

  if (isLocalImageSrc(src)) {
    return true;
  }

  try {
    const parsedUrl = new URL(src);
    return parsedUrl.protocol === 'https:' && OPTIMIZABLE_REMOTE_IMAGE_HOSTS.has(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function shouldBypassNextImageOptimization(src: string) {
  return !isOptimizableImageSrc(src);
}
