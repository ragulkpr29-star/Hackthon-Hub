import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ============================================================
// lib/supabase/admin.ts — PRIVILEGED service-role client
//
// Bypasses Row Level Security entirely. This is intentional and
// matches the RLS policies defined in supabase/migrations/002_developer_vector.sql
// (e.g. "Service role can write skill scores"), which were
// designed assuming server-triggered writes (the background
// analysis pipeline: GitHub analysis, AI analysis, skill scores,
// developer vectors, job status updates) run as service-role.
//
// The `import "server-only"` guard below makes any accidental
// import from a Client Component fail at build time.
//
// NEVER import this from:
//   - a 'use client' component or hook
//   - any file reachable from the browser bundle
//   - a request handler that should respect the calling user's
//     own permissions (use lib/supabase/server.ts for that)
// ============================================================

let adminClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createAdminClient() {
    if (adminClient) return adminClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error(
            "createAdminClient: NEXT_PUBLIC_SUPABASE_URL is not set."
        );
    }

    if (!serviceRoleKey) {
        throw new Error(
            "createAdminClient: SUPABASE_SERVICE_ROLE_KEY is not set. " +
            "This is required for server-side background jobs " +
            "(analysis pipeline, GitHub/AI/vector writes). " +
            "Set it in your server environment (never NEXT_PUBLIC_*)."
        );
    }

    adminClient = createSupabaseClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return adminClient;
}