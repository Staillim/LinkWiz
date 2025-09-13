'use client';

import { LinksTable } from '@/components/links-table';
import { UrlShortenerForm } from '@/components/url-shortener-form';
import { auth, db } from '@/lib/firebase';
import { Link as LinkType } from '@/lib/definitions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const linksQuery = query(collection(db, 'links'), where('userId', '==', user.uid));
    
    const unsubscribeLinks = onSnapshot(linksQuery, (linksSnapshot) => {
      const userLinks: Omit<LinkType, 'clicks'>[] = linksSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (data.createdAt) {
            return {
              id: doc.id,
              originalUrl: data.originalUrl,
              shortCode: data.shortCode,
              createdAt: data.createdAt.toDate().toISOString(),
              userId: data.userId,
            };
          }
          return null;
        })
        .filter(Boolean) as Omit<LinkType, 'clicks'>[];
      
      const linkIds = userLinks.map(link => link.id);

      if (linkIds.length === 0) {
        setLinks([]);
        setLoading(false);
        return;
      }

      const clicksQuery = query(collection(db, 'clicks'), where('linkId', 'in', linkIds));

      const unsubscribeClicks = onSnapshot(clicksQuery, (clicksSnapshot) => {
        const clicksCountByLinkId = new Map<string, number>();

        clicksSnapshot.forEach((doc) => {
          const linkId = doc.data().linkId;
          clicksCountByLinkId.set(linkId, (clicksCountByLinkId.get(linkId) || 0) + 1);
        });

        const linksWithClicks: LinkType[] = userLinks.map(link => ({
          ...link,
          clicks: clicksCountByLinkId.get(link.id) || 0,
        }));

        setLinks(linksWithClicks);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching clicks: ", error);
        setLoading(false);
      });

      return () => unsubscribeClicks();

    }, (error) => {
      console.error("Error fetching links: ", error);
      setLoading(false);
    });

    return () => unsubscribeLinks();
  }, [user, authLoading]);

  return (
    <div className="space-y-8">
      <UrlShortenerForm />
      <LinksTable links={links} loading={loading || authLoading} />
    </div>
  );
}
