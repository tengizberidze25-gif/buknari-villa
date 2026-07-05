import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { supabase } from '../lib/supabase';

export const alt = 'Buknari Villa — ვილების და სახლების გაქირავება ბუკნარში';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getFeaturedPhoto() {
  try {
    const { data } = await supabase
      .from('villas')
      .select('villa_photos(url, sort_order)')
      .eq('status', 'approved')
      .eq('is_available', true)
      .limit(10);

    for (const v of data || []) {
      const photos = (v.villa_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
      if (photos[0]?.url) return photos[0].url;
    }
  } catch (e) {
    // fall through to no-photo background
  }
  return null;
}

export default async function Image() {
  const [photoUrl, fontData] = await Promise.all([
    getFeaturedPhoto(),
    readFile(join(process.cwd(), 'app/assets/NotoSansGeorgian-Regular.woff')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#12130f',
        }}
      >
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(to top, rgba(18,19,15,0.95) 0%, rgba(18,19,15,0.6) 42%, rgba(18,19,15,0.15) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 64,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 60, color: '#F3EFE6', fontFamily: 'Noto Sans Georgian' }}>
            Buknari Villa
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#CBBFA4',
              marginTop: 14,
              fontFamily: 'Noto Sans Georgian',
            }}
          >
            ვილების და სახლების გაქირავება ბუკნარში
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#2F7FB5',
              marginTop: 18,
              fontFamily: 'Noto Sans Georgian',
            }}
          >
            buknarivilla.ge
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Sans Georgian',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
