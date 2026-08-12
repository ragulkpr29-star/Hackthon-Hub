import axios from "axios";
import { LinkedInRepository } from "@/lib/repositories/linkedin.repository";
import { Logger } from "@/lib/core/logger";

export interface LinkedInSummary {
    snapshotId?: string;

    name: string;

    headline: string;

    summary: string;

    location: string;

    followers: number;

    connections: number;

    company: any;

    skills: string[];

    experience: any[];

    education: any[];

    certifications: any[];

    projects: any[];

    raw: any;
}

export class LinkedInService {
    static async analyze(
        userId: string,
        linkedinUrl: string
    ): Promise<LinkedInSummary> {
        Logger.info(`Starting LinkedIn analysis for ${linkedinUrl}`);

        try {
            const response = await axios.post(
                "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1viktl72bvl7bjuj0&notify=false&include_errors=true",
                {
                    input: [
                        {
                            url: linkedinUrl,
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const raw = response.data;

            console.log("========================================");
            console.log("BRIGHT DATA RESPONSE");
            console.log("========================================");
            console.dir(raw, { depth: null });

            const result: LinkedInSummary = {
                snapshotId: raw.id,

                name: raw.name ?? "",

                headline: raw.position ?? "",

                summary: raw.about ?? "",

                location: raw.location ?? raw.city ?? "",

                followers: raw.followers ?? 0,

                connections: raw.connections ?? 0,

                company: raw.current_company ?? {},

                skills: [],

                experience: raw.experience ?? [],

                education: raw.education ?? [],

                certifications: raw.honors_and_awards ?? [],

                projects: raw.activity ?? [],

                raw,
            };

            await LinkedInRepository.saveAnalysis({
                user_id: userId,
                linkedin_url: linkedinUrl,
                profile_json: raw,
                headline: result.headline,
                summary: result.summary,
                skills: result.skills,
                experience: result.experience,
                education: result.education,
                certifications: result.certifications,
                projects: result.projects,
            });

            Logger.info("LinkedIn analysis saved.");

            return result;
        } catch (error: any) {
            console.error("========================================");
            console.error("LINKEDIN ANALYSIS ERROR");
            console.error("========================================");

            console.error(error.response?.data || error.message);

            throw error;
        }
    }
}