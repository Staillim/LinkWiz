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
import { notFound } from 'next/navigation';


async function trackAndRedirect(shortCode: string) {
  if (!shortCode) {
    notFound();
  }

  const q = query(
    collection(db, 'links'),
    where('shortCode', '==', shortCode)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    notFound();
  } 
  
  const linkDoc = querySnapshot.docs[0];
  const linkData = linkDoc.data();
  const originalUrl = linkData.originalUrl;
  const linkId = linkDoc.id;

  try {
    const headersList = headers();
    const xff = headersList.get('x-forwarded-for');
    const ipCandidate = xff ? xff.split(',')[0].trim() : headersList.get('x-real-ip') ?? 'unknown';

    let geoData: any = {};
    if (ipCandidate && ipCandidate !== 'unknown' && !ipCandidate.startsWith('127.')) {
        const geoResponse = await fetch(`https://ipapi.co/${ipCandidate}/json/`);
        if (geoResponse.ok) {
            geoData = await geoResponse.json();
        }
    }

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
  } catch (error) {
    console.error('Error tracking click:', error);
    // Don't block redirect if tracking fails
  }

  redirect(originalUrl);
}

export default async function ShortLinkPage({ params }: { params: { shortCode: string } }) {
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
