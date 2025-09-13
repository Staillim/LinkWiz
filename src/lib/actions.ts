'use server';

import { suggestCustomLink } from '@/ai/flows/suggest-custom-link';
import { z } from 'zod';

const schema = z.object({
  url: z.string({ required_error: 'Please enter a URL' }).url('Please enter a valid URL.'),
});

export async function getSuggestedSlugAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = schema.safeParse({
    url: formData.get('originalUrl'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.url?.[0],
      slug: null,
    };
  }

  try {
    const result = await suggestCustomLink({ originalUrl: validatedFields.data.url });
    return { slug: result.suggestedSlug, error: null };
  } catch (e) {
    return {
      error: 'AI suggestion failed. Please try again.',
      slug: null,
    };
  }
}
