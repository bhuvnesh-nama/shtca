/**
 * Formats image/media URLs so relative `/public/...` paths
 * always load cleanly from backend server or proxy.
 */
export const formatMediaUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

