/**
 * useFormValidation Hook
 * Generic form validation wrapper using React Hook Form + Zod
 * TDD §4: Custom hooks for shared logic
 */

import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';

/**
 * Generic form validation hook
 * @param schema - Zod schema for validation
 * @param options - Additional React Hook Form options
 */
export function useFormValidation<T extends FieldValues>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'>
) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    ...options,
  });

  return form;
}

