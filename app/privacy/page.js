import { headers } from 'next/headers';
import PrivacyContent from './PrivacyContent';
import { buildAlternates } from '../hreflang';

export async function generateMetadata() {
  const locale = headers().get('x-locale') || 'ka';
  const { canonical, languages } = buildAlternates('/privacy', locale);
  return {
    title: 'კონფიდენციალურობის პოლიტიკა — Buknari Villa',
    description: 'ინფორმაცია იმის შესახებ, თუ რა მონაცემებს აგროვებს buknarivilla.ge და როგორ იყენებს მათ.',
    alternates: { canonical, languages },
  };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
