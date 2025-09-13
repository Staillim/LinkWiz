import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json();

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    const ip = req.ip ?? req.headers.get('X-Forwarded-For') ?? 'unknown';
    const userAgent = req.headers.get('User-Agent') ?? 'unknown';
    
    let geoData = {
        ip,
        country_name: 'unknown',
        city: 'unknown',
        region: 'unknown',
        latitude: null,
        longitude: null,
    };

    try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoResponse.ok) {
            const data = await geoResponse.json();
            if (!data.error) {
                 geoData = {
                    ip: data.ip || ip,
                    country_name: data.country_name,
                    city: data.city,
                    region: data.region,
                    latitude: data.latitude,
                    longitude: data.longitude,
                };
            }
        }
    } catch (geoError) {
        console.error("Geolocation fetch failed:", geoError);
        // Continue with default geoData
    }


    await addDoc(collection(db, 'clicks'), {
      linkId: linkId,
      timestamp: serverTimestamp(),
      ipAddress: geoData.ip,
      userAgent: userAgent,
      country: geoData.country_name,
      city: geoData.city,
      region: geoData.region,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
