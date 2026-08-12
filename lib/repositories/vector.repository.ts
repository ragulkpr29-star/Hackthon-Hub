import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";

export class VectorRepository {
  static async upsertVector(
    userId: string,
    embedding: number[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const supabase = await createClient();

    console.log("========== SAVING VECTOR ==========");
    console.log({
      user_id: userId,
      embedding_length: embedding.length,
      metadata,
    });

    const { data, error } = await supabase
      .from("developer_vectors")
      .upsert(
        {
          user_id: userId,
          embedding,
          metadata,
        },
        {
          onConflict: "user_id",
        }
      )
      .select();

    console.log("Inserted:");
    console.log(data);

    console.log("Error:");
    console.log(error);

    if (error) {
      console.log("========== VECTOR ERROR ==========");
      console.dir(error, { depth: null });

      throw error;
    }

    Logger.info("Developer vector saved successfully");
  }

  static async getVector(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("developer_vectors")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      Logger.error("Failed to fetch developer vector", error);
      return null;
    }

    return data;
  }
}