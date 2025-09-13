'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { nanoid } from 'nanoid';

const FormSchema = z.object({
  originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  customSlug: z.string().optional(),
});

export function UrlShortenerForm() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      originalUrl: '',
      customSlug: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a link.',
        variant: 'destructive',
      });
      return;
    }
    
    const shortCode = data.customSlug || nanoid(6);

    try {
      await addDoc(collection(db, 'links'), {
        originalUrl: data.originalUrl,
        shortCode: shortCode,
        clicks: 0,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      toast({
        title: 'Link Shortened!',
        description: `Your new link is ready: linkwiz.io/${shortCode}`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create link. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // nanoid is ESM only, and this is a client component.
  // This is a workaround to avoid require() issues.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <LinkIcon className="h-6 w-6" />
          Shorten a new link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-very-long-url.com/goes-here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Slug (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                       <div className="relative w-full">
                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">linkwiz.io/</span>
                         <Input placeholder="my-custom-link" className="pl-[82px]" {...field} />
                       </div>
                    </FormControl>
                  </div>
                  <FormDescription>
                    Customize your short link for better branding.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Shorten Link"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
