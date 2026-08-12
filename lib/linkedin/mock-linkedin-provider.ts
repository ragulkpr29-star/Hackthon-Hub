import {
    LinkedInProvider,
    LinkedInProfile,
} from "./provider";

export class MockLinkedInProvider implements LinkedInProvider {
    async extract(url: string): Promise<LinkedInProfile> {
        console.log("Mock LinkedIn Analysis:", url);

        return {
            name: "LinkedIn User",
            headline: "Software Developer",
            about:
                "Passionate software developer interested in AI, Web Development and Hackathons.",

            skills: [
                "React",
                "Next.js",
                "TypeScript",
                "Python",
                "Git",
            ],

            experience: [
                "Student Developer",
            ],

            education: [
                "Kongu Engineering College",
            ],

            certifications: [
                "AWS Cloud Practitioner",
            ],

            projects: [
                "Hackathon Hub",
            ],
        };
    }
}