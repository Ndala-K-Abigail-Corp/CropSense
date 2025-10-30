import { z } from 'zod';

/**
 * Region selection schema
 * Validates user's region/location for context-aware recommendations
 */
export const regionSchema = z.object({
  region: z.string().min(1, 'Region is required'),
  country: z.string().optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

/**
 * Crop selection schema
 * Validates crop type for targeted agricultural guidance
 */
export const cropSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required'),
  cropType: z
    .enum(['cereal', 'vegetable', 'fruit', 'legume', 'oilseed', 'other'])
    .optional(),
  plantingDate: z.string().optional(),
  harvestDate: z.string().optional(),
});

/**
 * Combined region and crop context schema
 */
export const regionCropContextSchema = z.object({
  region: regionSchema.optional(),
  crop: cropSchema.optional(),
  season: z
    .enum(['spring', 'summer', 'fall', 'winter', 'year-round'])
    .optional(),
});

// Type exports
export type Region = z.infer<typeof regionSchema>;
export type Crop = z.infer<typeof cropSchema>;
export type RegionCropContext = z.infer<typeof regionCropContextSchema>;

