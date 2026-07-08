import { headers } from 'next/headers';
import TermsContent from './TermsContent';
import { buildAlternates } from '../hreflang';

export async function generateMetadata() {
  const locale = headers().get('x-locale') || 'ka';
  const { canonical, languages } = buildAlternates('/terms', locale);
  return {
    title: 'წესები და პირობები — Buknari Villa',
    description: 'ჯავშნის, გაუქმებისა და პასუხისმგებლობის წესები buknarivilla.ge-ზე.',
    alternates: { canonical, languages },
  };
}

export default function TermsPage() {
  return <TermsContent />;
}
