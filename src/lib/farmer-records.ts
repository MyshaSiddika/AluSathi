import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function readRecords(userId: string, kind: "scan" | "reminder" | "yield") {
  const { data, error } = await supabase.from("farmer_records").select("id,payload,created_at").eq("user_id", userId).eq("kind", kind).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function writeRecord(userId: string, kind: "scan" | "reminder" | "yield", id: string, payload: Json, createdAt = new Date().toISOString()) {
  const { error } = await supabase.from("farmer_records").upsert({ id, user_id: userId, kind, payload, created_at: createdAt });
  if (error) throw error;
}

export async function deleteRecord(userId: string, kind: "scan" | "reminder" | "yield", id?: string) {
  let query = supabase.from("farmer_records").delete().eq("user_id", userId).eq("kind", kind);
  if (id) query = query.eq("id", id);
  const { error } = await query;
  if (error) throw error;
}
