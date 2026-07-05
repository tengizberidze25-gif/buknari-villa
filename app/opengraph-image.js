import { ImageResponse } from 'next/og';
import { supabase } from '../lib/supabase';

export const alt = 'Buknari Villa — ვილების და სახლების გაქირავება ბუკნარში';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Noto Sans Georgian (static, subset to Georgian script) embedded as base64,
// split into short chunks so it's easy to copy/paste — no binary file upload needed.
const FONT_BASE64 =
  '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' +
  'xHEfgzjnECHhwqUr127cunPvwaMnz168evPuw6cv3378+vMvKSUtIysnr6CopKyiqqauoamlraOrp29gaGRsYmpmbmFpZW1ja3ciCB6MIAYAAIBdRnvbts16/SYKikrKKqpq6hqaWto6unr6BoZGxiamZuYWllbWNrZ29g6OTs4urm7uHp5e3j6+fv4CoUgskcpyguDB' +
  'iIEAAADY57p0bdu2zQWbCIuIiolLSEpJy8jKySsoKimrqKqpa2hqaevo6ukbGBoZm5iamVtYWlkHIRtbO3sHRydnF1c3dw9PL28fX7/gL0GGw+yleZmAFugCh1IYigLo2ILaApV4jci47X8pI58Ta859FohzrNcb5uL+vC08eQ8cOb6bP56o9ycanRcvbtx48rTysPJw' +
  'uspP+SnP8iRPcnt7tjfLg08KfPLJ2xvlkRMnvvhyv7pf3b3dvXnw0N/0N/VL3T5zs3V9nQePD19+f/oknMLJixdv3o6djp1cuHDgwJEjV672m+9FPaknPvjQf+n3sfIw1fvWv9WLuv0tm898s/d+fXdaabGfuMKTh8CRfd/uj2PnxYsbN5487TvsO9yt8lN+yrM8yZN9' +
  '2T71O/iOwCefvL1RHjlx4osvd6u71d3b3ZsHD/1Nf1O/1C/7za2ur/PgwZOnudcbQg/qS33x5q3/tSdctT3e/kc8uXDhwIEjR65c3TMfinpST+43+SE/zF3mLn3qSX1v/Vu9qLuzsvnMN99/AWmXyW8A';

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
  const photoUrl = await getFeaturedPhoto();
  const fontData = Buffer.from(FONT_BASE64, 'base64');

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
          <img src={photoUrl}
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
