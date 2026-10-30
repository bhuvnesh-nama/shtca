/**
 * Formats image/media URLs so relative `/public/...` paths
 * always load cleanly from backend server or proxy.
 */
export const formatMediaUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ""
    ? import.meta.env.VITE_API_BASE_URL
    : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
  return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

