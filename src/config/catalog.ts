export const WORDPRESS_API_URL =
  "https://app.realmeidakits.com.br/wp-json/re-almeida/v1";
export function catalogConfig() {
  return { source: "wordpress" as const, apiUrl: WORDPRESS_API_URL };
}
