/**
 * Server-only Supabase access for MEKO.
 *
 * Reads three secrets (set in the project's Secrets section):
 *   MEKO_SB_URL     - project URL
 *   MEKO_SB_ANON    - public anon key (RLS enforced)
 *   MEKO_SB_SERVICE - service role key (full privileges, server only)
 *
 * This file is *.server.ts: it is blocked from every client bundle.
 * Never import it from a component; import it inside a server-fn handler.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function url(): string {
  const v = process.env["MEKO_SB_URL"];
  if (!v) throw new Error("Missing secret MEKO_SB_URL");
  return v;
}

/** Public reads. Anon key -> Row Level Security is enforced for every query. */
export function getPublicClient(): SupabaseClient {
  const key = process.env["MEKO_SB_ANON"];
  if (!key) throw new Error("Missing secret MEKO_SB_ANON");
  return createClient(url(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Privileged server operations only. Service role key bypasses RLS. */
export function getServiceClient(): SupabaseClient {
  const key = process.env["MEKO_SB_SERVICE"];
  if (!key) throw new Error("Missing secret MEKO_SB_SERVICE");
  return createClient(url(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
