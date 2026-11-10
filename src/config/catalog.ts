export const WORDPRESS_ROOT = "/app";
export const WORDPRESS_API_URL = WORDPRESS_ROOT + "/wp-json/re-almeida/v1";
export function catalogConfig() {
  return { source: "wordpress" as const, apiUrl: WORDPRESS_API_URL };
}
