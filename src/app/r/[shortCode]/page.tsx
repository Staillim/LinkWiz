'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

async function trackAndRedirect(shortCode: string) {
  if (!shortCode) {
    redirect('/dashboard');
  }

  try {
    const q = query(
      collection(db, 'links'),
      where('shortCode', '==', shortCode)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('No such link!');
      redirect('/dashboard');
    } else {
      const linkDoc = querySnapshot.docs[0];
      const linkData = linkDoc.data();
      const originalUrl = linkData.originalUrl;
      const linkId = linkDoc.id;

      // 1. Capture IP from request headers
      const headersList = headers();
      const xff = headersList.get('x-forwarded-for');
      const ipCandidate = xff ? xff.split(',')[0].trim() : headersList.get('x-real-ip') ?? 'unknown';

      // 2. Call ipapi.co
      let geoData: any = {};
      try {
        if (ipCandidate && ipCandidate !== 'unknown') {
            const geoResponse = await fetch(`https://ipapi.co/${ipCandidate}/json/`);
            if (geoResponse.ok) {
                geoData = await geoResponse.json();
            }
        }
      } catch (geoError) {
        console.error('Geolocation fetch failed:', geoError);
        // Don't block redirect if geo lookup fails
      }

      // 3. Save click data to Firestore
      const userAgent = headersList.get('user-agent') ?? null;
      const ipAddress = geoData.ip ?? ipCandidate;
      const city = geoData.city ?? null;
      const country = geoData.country_name ?? geoData.country ?? null;

      const clickData = {
        linkId,
        timestamp: serverTimestamp(),
        ipAddress,
        city,
        country,
        userAgent,
      };

      await addDoc(collection(db, 'clicks'), clickData);

      // 4. Redirect to original URL
      redirect(originalUrl);
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
    redirect('/dashboard');
  }
}

export default async function ShortLinkPage({ params }: { params: { shortCode: string } }) {
  // Although this component renders a loading state,
  // the server-side logic in trackAndRedirect will run first.
  // If successful, it will redirect before the user sees this page.
  // This is shown only if there's a delay or for non-JS clients.
  await trackAndRedirect(params.shortCode);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
