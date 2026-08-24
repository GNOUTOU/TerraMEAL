"use server";

import { createClient } from "@/lib/supabase/server";
import type { SearchResult } from "@/lib/search-utils";

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("global_search", { q: query.trim() });
  if (error) return [];
  return (data as SearchResult[]) ?? [];
}
