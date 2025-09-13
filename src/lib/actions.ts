'use server';

import { z } from 'zod';

const schema = z.object({
  url: z.string({ required_error: 'Please enter a URL' }).url('Please enter a valid URL.'),
});
