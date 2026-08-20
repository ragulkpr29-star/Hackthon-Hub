import { UserRepository } from "@/lib/repositories/user.repository";
import { JobRepository } from "@/lib/repositories/job.repository";
import { Profile } from "@/lib/types";
import { Logger } from "@/lib/core/logger";

export class OnboardingService {

  static async startOnboarding(
    userId: string,
    profileData: Partial<Profile>
  ): Promise<string> {

    Logger.info(`Starting onboarding for user ${userId}`);

    // Upsert profile (creates if it doesn't exist, updates if it does)
    await UserRepository.upsertProfile({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    });

    // Create analysis job
    const job = await JobRepository.createJob(userId);

    Logger.info(
      `Onboarding initialized for user ${userId}, Job ID: ${job.id}`
    );

    return job.id;
  }

}