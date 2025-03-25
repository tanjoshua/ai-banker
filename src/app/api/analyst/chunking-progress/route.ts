import { NextResponse } from 'next/server';
import { progressEmitter } from '@/lib/utils/progress-emitter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Send initial connection established message
    await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
    );

    // Add listener for progress updates
    const handleProgress = (event: any) => {
        writer.write(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
    };

    progressEmitter.addListener(handleProgress);

    // Remove listener when client disconnects
    req.signal.addEventListener('abort', () => {
        progressEmitter.removeListener(handleProgress);
    });

    return new Response(stream.readable, {
        headers,
    });
} 