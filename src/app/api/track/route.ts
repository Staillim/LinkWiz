import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json();

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    // Obtener IP de forma robusta (X-Forwarded-For primero, luego x-real-ip, luego req.ip si está disponible)
    const xff = req.headers.get('x-forwarded-for');
    const ipFromHeader = xff ? xff.split(',')[0].trim() : undefined;
    const ipCandidate = (req as any).ip ?? ipFromHeader ?? req.headers.get('x-real-ip') ?? null;

    if (!ipCandidate) {
      return NextResponse.json({ error: 'Client IP not found' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') ?? null;

    // Llamada a ipapi para extraer datos reales
    let geoData: any;
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ipCandidate}/json/`);
      if (!geoResponse.ok) {
        console.error('ipapi responded with non-OK status:', geoResponse.status);
        return NextResponse.json({ error: 'Geolocation lookup failed' }, { status: 502 });
      }
      geoData = await geoResponse.json();
    } catch (geoError) {
      console.error('Geolocation fetch failed:', geoError);
      return NextResponse.json({ error: 'Geolocation lookup failed' }, { status: 502 });
    }

    // Verificar que la API devolvió datos válidos (sin campo error) y que tenemos los campos que necesitamos
    if (geoData?.error) {
      console.error('ipapi returned error:', geoData);
      return NextResponse.json({ error: 'Geolocation service returned an error' }, { status: 502 });
    }

    const ipAddress = geoData.ip ?? null;
    const city = geoData.city ?? null;
    // Guardamos el nombre completo del país si está disponible; si no, tomamos el código (pero preferimos country_name)
    const country = geoData.country_name ?? geoData.country ?? null;

    if (!ipAddress || !city || !country) {
      console.error('Geolocation data incomplete:', { ipAddress, city, country, geoData });
      return NextResponse.json({ error: 'Geolocation data incomplete' }, { status: 502 });
    }

    // Construir solo los campos que pediste
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
