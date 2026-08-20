import { z } from 'zod';

export const profileSchema = z.object({
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  availability_status: z.enum(['looking_for_team', 'in_team', 'available', 'busy']),
  github_url: z.string().min(1, 'github url is mandatory').url('Must be a valid URL').refine((url) => url.includes('github.com'), 'Must be a valid GitHub URL'),
  linkedin_url: z.string().min(1, 'linkedin url is mandatory').url("Must be a valid LinkedIn URL"),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  technical_interests: z.array(z.string()).refine((items) => new Set(items).size === items.length, {
    message: 'Technical interests cannot contain duplicates',
  }),
  programming_languages: z.array(z.string()).refine((items) => new Set(items).size === items.length, {
    message: 'Programming languages cannot contain duplicates',
  }),
  frameworks: z.array(z.string()).refine((items) => new Set(items).size === items.length, {
    message: 'Frameworks cannot contain duplicates',
  }),
  tools: z.array(z.string()).refine((items) => new Set(items).size === items.length, {
    message: 'Tools cannot contain duplicates',
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
