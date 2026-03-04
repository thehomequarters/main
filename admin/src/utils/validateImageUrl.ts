/**
 * Validates that a URL is safe to use as an image source.
 * - Must be https (prevents javascript: and data: injection)
 * - Must look like an image file or come from a known CDN
 * Returns true for empty strings (field is optional).
 */
export function isValidImageUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;

    const pathname = parsed.pathname.toLowerCase();
    const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"];
    const hasImageExt = IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));

    const TRUSTED_HOSTS = [
      "images.unsplash.com",
      "cloudinary.com",
      "res.cloudinary.com",
      "imagedelivery.net",
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "storage.googleapis.com",
      "cdn.",
      "img.",
      "images.",
    ];
    const isKnownHost = TRUSTED_HOSTS.some((h) => parsed.hostname.includes(h));

    return hasImageExt || isKnownHost;
  } catch {
    return false;
  }
}
