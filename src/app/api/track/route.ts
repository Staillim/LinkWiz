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
    
    let clickData: any = {
      linkId: linkId,
      timestamp: serverTimestamp(),
      ipAddress: ip,
      userAgent: userAgent,
      country: 'unknown',
      city: 'unknown',
    };

    try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoResponse.ok) {
            const data = await geoResponse.json();
            if (!data.error) {
                 clickData = {
                    ...clickData,
                    ipAddress: data.ip || ip,
                    country: data.country_code, // Using country_code for the short version like 'CO'
                    city: data.city,
                };
            }
        }
    } catch (geoError) {
        console.error("Geolocation fetch failed:", geoError);
        // Continue with default/partial data
    }


    await addDoc(collection(db, 'clicks'), clickData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
