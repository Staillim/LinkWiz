'use client';

import { LinksTable } from '@/components/links-table';
import { UrlShortenerForm } from '@/components/url-shortener-form';
import { auth, db } from '@/lib/firebase';
import { Link as LinkType } from '@/lib/definitions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'links'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userLinks: LinkType[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userLinks.push({
            id: doc.id,
            originalUrl: data.originalUrl,
            shortCode: data.shortCode,
            clicks: data.clicks,
            createdAt: data.createdAt.toDate().toISOString(),
            userId: data.userId,
          });
        });
        setLinks(userLinks);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <UrlShortenerForm />
      <LinksTable links={links} loading={loading} />
    </div>
  );
}
