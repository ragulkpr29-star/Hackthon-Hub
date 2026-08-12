import {
    LinkedInProfile,
    LinkedInProvider,
} from "./provider";

export class FreeLinkedInExtractor implements LinkedInProvider {
    async extract(url: string): Promise<LinkedInProfile> {
        console.log("Extracting LinkedIn profile...");
        console.log(url);

        // Temporary implementation
        // Later we'll replace this with a real extractor

        return {
            name: "",
            headline: "",
            about: "",
            skills: [],
            experience: [],
            education: [],
            certifications: [],
            projects: [],
        };
    }
}