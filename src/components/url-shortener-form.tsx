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
import { Link as LinkIcon, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useActionState } from 'react';
import { getSuggestedSlugAction } from '@/lib/actions';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  customSlug: z.string().optional(),
});

export function UrlShortenerForm() {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionState, formAction] = useActionState(getSuggestedSlugAction, {
    slug: null,
    error: null,
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      originalUrl: '',
      customSlug: '',
    },
  });

  const originalUrl = form.watch('originalUrl');

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log(data);
    toast({
      title: 'Link Shortened!',
      description: `Your new link is ready: linkwiz.io/${
        data.customSlug || 'xyz123'
      }`,
    });
    form.reset();
  };
  
  const suggestSlug = () => {
    const formData = new FormData();
    formData.append('originalUrl', originalUrl);
    setIsSuggesting(true);
    formAction(formData);
  }

  useEffect(() => {
    setIsSuggesting(false);
    if (suggestionState?.slug) {
      form.setValue('customSlug', suggestionState.slug);
      toast({
        title: 'AI Suggestion Applied',
        description: `We've suggested a custom slug for you.`,
      });
    } else if (suggestionState?.error) {
      form.setError('originalUrl', { message: suggestionState.error });
    }
  }, [suggestionState, form.setValue, form.setError, toast]);

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
                    <Button type="button" variant="outline" onClick={suggestSlug} disabled={!originalUrl || form.formState.isSubmitting || isSuggesting}>
                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Suggest</span>
                    </Button>
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
