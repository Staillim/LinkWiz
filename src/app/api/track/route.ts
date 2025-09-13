import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json();

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    // Obtener IP de forma robusta
    const xff = req.headers.get('x-forwarded-for');
    const ipFromHeader = xff ? xff.split(',')[0].trim() : undefined;
    const ipCandidate = (req as any).ip ?? ipFromHeader ?? req.headers.get('x-real-ip') ?? null;

    const userAgent = req.headers.get('user-agent') ?? null;

    // Llamada a ipapi para extraer datos reales
    let geoData: any = {};
    try {
      if (ipCandidate) {
        const geoResponse = await fetch(`https://ipapi.co/${ipCandidate}/json/`);
        if (geoResponse.ok) {
          geoData = await geoResponse.json();
        } else {
          console.error('ipapi responded with non-OK status:', geoResponse.status);
        }
      }
    } catch (geoError) {
      console.error('Geolocation fetch failed:', geoError);
    }

    // Extraer valores, si no existen se ponen en null
    const ipAddress = geoData.ip ?? ipCandidate ?? null;
    const city = geoData.city ?? null;
    const country = geoData.country_name ?? geoData.country ?? null;

    // Construir siempre el objeto (aunque falten valores)
    const clickData = {
      linkId,
      timestamp: serverTimestamp(),
      ipAddress,
      city,
      country,
      userAgent,
    };

    await addDoc(collection(db, 'clicks'), clickData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
