/**
 * RegionCropForm Component
 * Form for selecting region and crop context
 * Uses React Hook Form + Zod validation
 * TDD §2, §5: Form validation with shared schemas
 */

import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useRegionCropContext } from '@/hooks/useRegionCropContext';
import { regionCropContextSchema, type RegionCropContext } from 'shared';

interface RegionCropFormProps {
  onSubmit?: (data: RegionCropContext) => void;
}

export function RegionCropForm({ onSubmit }: RegionCropFormProps) {
  const { setRegion, setCrop, setSeason } = useRegionCropContext();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation(regionCropContextSchema);

  const onFormSubmit = async (data: RegionCropContext) => {
    // Update context
    if (data.region) setRegion(data.region);
    if (data.crop) setCrop(data.crop);
    if (data.season) setSeason(data.season);

    // Call parent callback if provided
    onSubmit?.(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Region Section */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-neutral-900">
          Your Region
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="region"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Region/Location <span className="text-feedback-error">*</span>
            </label>
            <Input
              id="region"
              {...register('region.region')}
              placeholder="e.g., Midwest USA, Punjab India"
              aria-invalid={errors.region?.region ? 'true' : 'false'}
              aria-describedby={
                errors.region?.region ? 'region-error' : undefined
              }
            />
            {errors.region?.region && (
              <p
                id="region-error"
                className="mt-1 text-sm text-feedback-error"
                role="alert"
              >
                {errors.region.region.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="country"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Country (optional)
            </label>
            <Input
              id="country"
              {...register('region.country')}
              placeholder="e.g., United States"
            />
          </div>
        </div>
      </div>

      {/* Crop Section */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-neutral-900">
          Your Crop
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="cropName"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Crop Name
            </label>
            <Input
              id="cropName"
              {...register('crop.cropName')}
              placeholder="e.g., Corn, Wheat, Tomatoes"
              aria-invalid={errors.crop?.cropName ? 'true' : 'false'}
              aria-describedby={
                errors.crop?.cropName ? 'crop-error' : undefined
              }
            />
            {errors.crop?.cropName && (
              <p
                id="crop-error"
                className="mt-1 text-sm text-feedback-error"
                role="alert"
              >
                {errors.crop.cropName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="cropType"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Crop Type (optional)
            </label>
            <select
              id="cropType"
              {...register('crop.cropType')}
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select type</option>
              <option value="cereal">Cereal</option>
              <option value="vegetable">Vegetable</option>
              <option value="fruit">Fruit</option>
              <option value="legume">Legume</option>
              <option value="oilseed">Oilseed</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Season Section */}
      <div>
        <label
          htmlFor="season"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Current Season (optional)
        </label>
        <select
          id="season"
          {...register('season')}
          className="flex h-10 w-full rounded-md border border-neutral-300 bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select season</option>
          <option value="spring">Spring</option>
          <option value="summer">Summer</option>
          <option value="fall">Fall</option>
          <option value="winter">Winter</option>
          <option value="year-round">Year-round</option>
        </select>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Preferences'}
      </Button>
    </form>
  );
}

