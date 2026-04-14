import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');
    const isDownload = searchParams.get('download') === '1';

    if (!videoUrl) {
      return new Response('Missing URL', { status: 400 });
    }

    // Security: Only allow Qwen CDN URLs
    if (!videoUrl.startsWith('https://cdn.qwenlm.ai')) {
      return new Response('Invalid Source', { status: 403 });
    }

    const headers: Record<string, string> = {};
    const range = req.headers.get('range');
    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(videoUrl, { headers });

    if (!response.ok && response.status !== 206) {
      return new Response('Failed to fetch video', { status: response.status });
    }

    const responseHeaders = new Headers();
    
    // Copy essential headers from the CDN response
    const copyHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    copyHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Force download if requested
    if (isDownload) {
      responseHeaders.set('Content-Disposition', `attachment; filename="ai-video-${Date.now()}.mp4"`);
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Video Proxy Error:', error);
    return new Response(error.message, { status: 500 });
  }
}
