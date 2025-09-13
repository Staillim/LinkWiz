import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-center">
      <Frown className="h-24 w-24 text-primary" />
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl font-headline">
          404 - Page Not Found
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
          Oops! The link you followed may be broken, or the page may have been
          removed.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go back to Dashboard</Link>
      </Button>
    </div>
  );
}
