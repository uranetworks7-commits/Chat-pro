'use server';

/**
 * @fileOverview Flow for updating user profile avatar using generative AI.
 *
 * - updateProfileAvatar - A function that updates the user's profile avatar based on a text description.
 * - UpdateProfileAvatarInput - The input type for the updateProfileAvatar function.
 * - UpdateProfileAvatarOutput - The return type for the updateProfileAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UpdateProfileAvatarInputSchema = z.object({
  description: z
    .string()
    .describe("A description or keywords for generating the profile avatar."),
});
export type UpdateProfileAvatarInput = z.infer<typeof UpdateProfileAvatarInputSchema>;

const UpdateProfileAvatarOutputSchema = z.object({
  avatarUrl: z.string().describe("The URL of the generated profile avatar."),
});
export type UpdateProfileAvatarOutput = z.infer<typeof UpdateProfileAvatarOutputSchema>;

export async function updateProfileAvatar(
  input: UpdateProfileAvatarInput
): Promise<UpdateProfileAvatarOutput> {
  return updateProfileAvatarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'updateProfileAvatarPrompt',
  input: {schema: UpdateProfileAvatarInputSchema},
  output: {schema: UpdateProfileAvatarOutputSchema},
  prompt: `Generate a profile avatar based on the following description: {{{description}}}. The avatar should be a visually appealing and professional representation of the user. Return a data URI containing the avatar image.`, // Updated prompt to request data URI
});

const updateProfileAvatarFlow = ai.defineFlow(
  {
    name: 'updateProfileAvatarFlow',
    inputSchema: UpdateProfileAvatarInputSchema,
    outputSchema: UpdateProfileAvatarOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: input.description,
      model: 'googleai/imagen-4.0-fast-generate-001',
    });

    if (!media?.url) {
      throw new Error('Failed to generate avatar image.');
    }

    return {avatarUrl: media.url}; // Returns the media url
  }
);
