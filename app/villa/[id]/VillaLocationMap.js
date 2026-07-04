'use client';

import dynamic from 'next/dynamic';

const VillaMap = dynamic(() => import('../../VillaMap'), { ssr: false });

export default function VillaLocationMap({ villa }) {
  return <VillaMap villas={[villa]} />;
}
