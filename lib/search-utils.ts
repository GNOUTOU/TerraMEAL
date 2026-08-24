export interface SearchResult {
  entity_type: string;
  id: string;
  label: string;
  subtitle: string | null;
}

const ENTITY_ROUTES: Record<string, string> = {
  project: "/projects/",
  intervention: "/interventions/",
  admin_zone: "/map?zone=",
  partner: "/admin/partners?highlight=",
  donor: "/admin/donors?highlight=",
};

export function resultHref(r: SearchResult) {
  return (ENTITY_ROUTES[r.entity_type] ?? "/") + r.id;
}
