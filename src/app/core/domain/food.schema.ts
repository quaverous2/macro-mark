import { z } from 'zod';

const nutritionValueSchema = z.number().finite().min(0).max(100);

export const foodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Enter a food name.').max(120),
  normalizedName: z.string().min(1).max(120),
  carbohydratesGramsPer100g: nutritionValueSchema,
  fatGramsPer100g: nutritionValueSchema,
  proteinGramsPer100g: nutritionValueSchema,
  saltGramsPer100g: nutritionValueSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
