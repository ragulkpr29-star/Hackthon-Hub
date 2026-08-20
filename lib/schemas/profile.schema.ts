import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Must be a valid email address'),
  student_id: z.string().min(1, 'Student ID is required'),
  department: z.string().min(1, 'Department is required'),
  year: z.string().min(1, 'Year is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
  
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  availability_status: z.enum(['looking_for_team', 'in_team', 'available', 'busy']),
  github_url: z.string().min(1, 'github url is mandatory').url('Must be a valid URL').refine((url) => url.includes('github.com'), 'Must be a valid GitHub URL'),
  linkedin_url: z.string().min(1, 'linkedin url is mandatory').url("Must be a valid LinkedIn URL"),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  technical_interests: z.array(z.string()).refine((items) => new Set(items).size === items.length, {
    message: 'Skills cannot contain duplicates',
  }),
  programming_languages: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ProfileFormData = z.infer<typeof profileSchema>;
