import { z } from 'zod';

export const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  whatsapp: z.string().regex(/^\+\d{8,15}$/, 'Enter a valid WhatsApp number in international format (e.g. +919876543210)'),
  location: z.string().min(1, 'Location is required').max(80, 'Location must be at most 80 characters'),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must agree to continue' }) }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const postSchema = z.object({
  type: z.enum(['offer', 'request']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(80, 'Title must be at most 80 characters'),
  category: z.enum(['motors_actuators', 'boards_controllers', 'sensors', 'drivers_modules', 'power_batteries', 'mechanical', 'wheels_gears_chassis', 'cables_connectors', 'tools_equipment', 'other']),
  model_number: z.string().max(60, 'Model number must be at most 60 characters').optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity must be at most 999'),
  condition: z.enum(['new', 'like_new', 'used_working', 'untested', 'for_parts']).nullable().optional(),
  details: z.string().max(500, 'Details must be at most 500 characters').optional().or(z.literal('')),
  share_modes: z.array(z.enum(['give', 'lend', 'swap'])).min(1, 'Select at least one share mode'),
  location: z.string().min(1, 'Location is required').max(80, 'Location must be at most 80 characters'),
  needed_by: z.string().optional().or(z.literal('')),
  honeypot: z.string().max(0, 'Bot detected').optional(),
}).refine(
  (data) => data.type !== 'offer' || data.condition != null,
  { message: 'Condition is required for offers', path: ['condition'] }
);

export type PostFormData = z.infer<typeof postSchema>;

export const reportSchema = z.object({
  reason: z.string().min(1, 'Please provide a reason').max(500, 'Reason must be at most 500 characters'),
});

export type ReportFormData = z.infer<typeof reportSchema>;
