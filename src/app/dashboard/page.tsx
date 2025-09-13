import { LinksTable } from '@/components/links-table';
import { UrlShortenerForm } from '@/components/url-shortener-form';
import { mockLinks } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <UrlShortenerForm />
      <LinksTable links={mockLinks} />
    </div>
  );
}
