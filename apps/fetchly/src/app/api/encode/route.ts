import { NextRequest, NextResponse } from 'next/server';
import { encode } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    const { url, filename } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    const endcodedUrl = await encode(url);
    const endcodedFileName = await encode(filename);
    return NextResponse.json({ id: endcodedUrl, fn: endcodedFileName });
  } catch (error) {
    console.error('Encode error:', error);
    return NextResponse.json(
      { error: 'Failed to encode URL' },
      { status: 500 }
    );
  }
}
