import { UserRepository } from "@/lib/repositories/user.repository";
import { JobRepository } from "@/lib/repositories/job.repository";
import { Profile } from "@/lib/types/models";
import { Logger } from "@/lib/core/logger";

export class OnboardingService {
  static async startOnboarding(userId: string, profileData: Partial<Profile>): Promise<string> {
    Logger.info(`Starting onboarding for user ${userId}`);

    // 1. Create Profile
    await UserRepository.createProfile({
      id: userId,
      ...profileData,
    });

    // 2. Create Analysis Job
    const job = await JobRepository.createJob(userId);

    Logger.info(`Onboarding initialized for user ${userId}, Job ID: ${job.id}`);
    
    // Return jobId so the API route can return it immediately
    return job.id;
  }
}
