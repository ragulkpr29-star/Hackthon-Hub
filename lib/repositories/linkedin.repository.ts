import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";

export class LinkedInRepository {
    static async saveAnalysis(data: {
        user_id: string;
        linkedin_url: string;
        profile_json: any;
        headline?: string;
        summary?: string;
        skills?: any[];
        experience?: any[];
        education?: any[];
        certifications?: any[];
        projects?: any[];
    }): Promise<void> {
        const supabase = await createClient();

        const { error } = await supabase
            .from("linkedin_analysis")
            .upsert(data, {
                onConflict: "user_id",
            });

        if (error) {
            Logger.error("Failed to save LinkedIn analysis", error);
            throw new DatabaseError("Failed to save LinkedIn analysis");
        }
    }

    static async getAnalysis(userId: string) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("linkedin_analysis")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            Logger.error("Failed to fetch LinkedIn analysis", error);
            throw new DatabaseError("Failed to fetch LinkedIn analysis");
        }

        return data;
    }
}