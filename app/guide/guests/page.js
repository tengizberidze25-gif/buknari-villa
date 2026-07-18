import GuideGuestsContent from './GuideGuestsContent';
import { buildAlternates } from '../../hreflang';
import { headers } from 'next/headers';

export async function generateMetadata() {
  const locale = headers().get('x-locale') || 'ka';
  const { canonical, languages } = buildAlternates('/guide/guests', locale);
  return {
    title: 'გზამკვლევი სტუმრებისთვის — Buknari Villa',
    description: 'ყველაფერი, რაც უნდა იცოდეთ buknarivilla.ge-ზე ვილის დათვალიერების, ფასის გაგებისა და დაჯავშნის შესახებ.',
    alternates: { canonical, languages },
  };
}

export default function GuideGuestsPage() {
  return <GuideGuestsContent />;
}
