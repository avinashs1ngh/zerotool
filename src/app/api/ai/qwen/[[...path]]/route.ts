import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';


const BASE_URL = 'https://qwen.aikit.club';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const path = pathSegments?.join('/') || '';
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    const token = process.env.QWEN_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'QWEN_ACCESS_TOKEN not configured in .env.local' }, { status: 500 });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message, type: 'api_error' } }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const path = pathSegments?.join('/') || '';
    const url = `${BASE_URL}/${path}`;
    
    const token = process.env.QWEN_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'QWEN_ACCESS_TOKEN not configured in .env.local' }, { status: 500 });
    }

    // Check if it's a streaming request
    let body;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('multipart/form-data')) {
      body = await req.formData();
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    if (contentType.includes('application/json')) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    // Handle streaming response
    if (body?.stream === true || response.headers.get('content-type')?.includes('text/event-stream')) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message, type: 'api_error' } }, { status: 500 });
  }
}
