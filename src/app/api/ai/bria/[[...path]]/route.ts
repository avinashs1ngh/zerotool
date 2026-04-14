import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';


const BASE_URL = 'https://bria.aikit.club/v2';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const path = pathSegments?.join('/') || '';
    const url = `${BASE_URL}/${path}`;
    const body = await req.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message, type: 'api_error' } }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const path = pathSegments?.join('/') || '';
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message, type: 'api_error' } }, { status: 500 });
  }
}
