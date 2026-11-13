/** Next.js basePath (mirrors next.config.mjs). Raw <img>/fetch URLs must include it. */
export const BASE_PATH = "/futuregraph";

export function withBasePath(path: string): string {
  if (path.startsWith(BASE_PATH + "/") || path === BASE_PATH) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiPath(path: string): string {
  return withBasePath(`/api${path.startsWith("/") ? path : `/${path}`}`);
}

/** Public site origin (no trailing slash, no basePath). */
export function getSiteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim().replace(/^"|"$/g, "");
  return raw.replace(/\/+$/, "").replace(new RegExp(`${BASE_PATH}$`), "");
}

/** Absolute URL for crawlers (X card unfurls, OpenGraph) — includes basePath. */
export function absoluteUrl(path: string): string {
  return `${getSiteOrigin()}${withBasePath(path)}`;
}

/**
 * Sanitizes a post-auth redirect target to a same-site path (relative to basePath) to prevent
 * open redirects. Returns "/" when the input is unsafe.
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next) return "/";
  let path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  if (path === BASE_PATH) return "/";
  if (path.startsWith(BASE_PATH + "/")) path = path.slice(BASE_PATH.length);
  if (/[\r\n]/.test(path)) return "/";
  return path;
}

export function scenarioSlugForNode(node: { scenarioId: string }): string {
  if (node.scenarioId === "scen-ai-2050") return "ai-2050";
  if (node.scenarioId === "scen-ai-2040") return "ai-2040";
  return "ai-2027";
}

/** Canonical forecasting page for any node (checkpoint questions live under /q). */
export function nodeForecastPath(node: { id: string; scenarioId: string }): string {
  if (node.scenarioId === "scen-checkpoints") return `/q/${node.id}`;
  return `/scenarios/${scenarioSlugForNode(node)}/n/${node.id}`;
}
