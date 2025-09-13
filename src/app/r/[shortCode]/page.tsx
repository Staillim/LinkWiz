'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function ShortLinkPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.shortCode as string;

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        router.push('/dashboard');
        return;
      }

      try {
        const q = query(
          collection(db, 'links'),
          where('shortCode', '==', shortCode)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error('No such link!');
          router.push('/dashboard'); // Or a 404 page
        } else {
          const linkDoc = querySnapshot.docs[0];
          const linkData = linkDoc.data();
          const originalUrl = linkData.originalUrl;

          // Track click in the background
          fetch('/api/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ linkId: linkDoc.id }),
          });

          // Redirect to original URL
          window.location.href = originalUrl;
        }
      } catch (error) {
        console.error('Error getting document:', error);
        router.push('/dashboard');
      }
    };

    handleRedirect();
  }, [shortCode, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
