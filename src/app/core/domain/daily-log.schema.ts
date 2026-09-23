import { z } from 'zod';

const nutritionValueSchema = z.number().finite().min(0).max(100);

export const dailyFoodEntrySchema = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid(),
  foodName: z.string().trim().min(1).max(120),
  amountGrams: z.number().finite().min(0).max(10_000),
  carbohydratesGramsPer100g: nutritionValueSchema,
  fatGramsPer100g: nutritionValueSchema,
  proteinGramsPer100g: nutritionValueSchema,
  saltGramsPer100g: nutritionValueSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(dailyFoodEntrySchema),
  updatedAt: z.date(),
});
