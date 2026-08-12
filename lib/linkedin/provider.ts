export interface LinkedInProfile {
    name?: string;
    headline?: string;
    about?: string;

    skills: string[];
    experience: string[];
    education: string[];
    certifications: string[];
    projects: string[];
}

export interface LinkedInProvider {
    extract(url: string): Promise<LinkedInProfile>;
}