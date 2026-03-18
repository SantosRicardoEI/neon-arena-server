import { supabase } from "@/integrations/supabase/client";
import type { DevelopmentUpdate } from "./types";

export async function getDevelopmentUpdates(): Promise<DevelopmentUpdate[]> {
  const { data, error } = await supabase
    .from("development_updates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[DevelopmentUpdates] fetch error:", error.message);
    return [];
  }

  return (data ?? []) as DevelopmentUpdate[];
}
