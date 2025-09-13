'use client';

import { LinksTable } from '@/components/links-table';
import { UrlShortenerForm } from '@/components/url-shortener-form';
import { auth, db } from '@/lib/firebase';
import { Link as LinkType } from '@/lib/definitions';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (user) {
      const q = query(collection(db, 'links'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const userLinksPromises = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          if (data.createdAt) {
            
            const clicksQuery = query(collection(db, 'clicks'), where('linkId', '==', doc.id));
            const clicksSnapshot = await getDocs(clicksQuery);

            return {
              id: doc.id,
              originalUrl: data.originalUrl,
              shortCode: data.shortCode,
              clicks: clicksSnapshot.size,
              createdAt: data.createdAt.toDate().toISOString(),
              userId: data.userId,
            };
          }
          return null;
        });

        const resolvedLinks = (await Promise.all(userLinksPromises)).filter(Boolean) as LinkType[];
        
        setLinks(resolvedLinks);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching links: ", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLinks([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  return (
    <div className="space-y-8">
      <UrlShortenerForm />
      <LinksTable links={links} loading={loading || authLoading} />
    </div>
  );
}
