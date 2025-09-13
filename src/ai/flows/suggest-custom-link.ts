'use server';

/**
 * @fileOverview AI-powered suggestion of a custom slug for a shortened URL.
 *
 * - suggestCustomLink - A function that suggests a custom slug based on the original URL.
 * - SuggestCustomLinkInput - The input type for the suggestCustomLink function.
 * - SuggestCustomLinkOutput - The return type for the suggestCustomLink function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCustomLinkInputSchema = z.object({
  originalUrl: z.string().describe('The original URL to be shortened.'),
});
export type SuggestCustomLinkInput = z.infer<typeof SuggestCustomLinkInputSchema>;

const SuggestCustomLinkOutputSchema = z.object({
  suggestedSlug: z.string().describe('A suggested custom slug for the shortened URL.'),
});
export type SuggestCustomLinkOutput = z.infer<typeof SuggestCustomLinkOutputSchema>;

export async function suggestCustomLink(input: SuggestCustomLinkInput): Promise<SuggestCustomLinkOutput> {
  return suggestCustomLinkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCustomLinkPrompt',
  input: {schema: SuggestCustomLinkInputSchema},
  output: {schema: SuggestCustomLinkOutputSchema},
  prompt: `Suggest a custom slug for the following URL, make it short and relevant to the content of the URL:

URL: {{{originalUrl}}}

Slug:`,
});

const suggestCustomLinkFlow = ai.defineFlow(
  {
    name: 'suggestCustomLinkFlow',
    inputSchema: SuggestCustomLinkInputSchema,
    outputSchema: SuggestCustomLinkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
