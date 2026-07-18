import GuideOwnersContent from './GuideOwnersContent';
import { buildAlternates } from '../../hreflang';
import { headers } from 'next/headers';

export async function generateMetadata() {
  const locale = headers().get('x-locale') || 'ka';
  const { canonical, languages } = buildAlternates('/guide/owners', locale);
  return {
    title: 'გზამკვლევი მფლობელებისთვის — Buknari Villa',
    description: 'ვილის მართვა, ფასდაკლებები, სარეფერალო სისტემა და ყველა ინსტრუმენტი buknarivilla.ge-ზე ვილის მფლობელებისთვის.',
    alternates: { canonical, languages },
    robots: { index: false, follow: false },
  };
}

export default function GuideOwnersPage() {
  return <GuideOwnersContent />;
}
