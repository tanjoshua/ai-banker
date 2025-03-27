import { FileProcessor } from '@/lib/services/file-processor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { files } = await req.json();
        
        if (!Array.isArray(files)) {
            return NextResponse.json(
                { error: 'Invalid input: files must be an array' },
                { status: 400 }
            );
        }

        const processor = new FileProcessor();
        const results = await processor.processFiles(files, (processed, total) => {
            // You could emit progress through a WebSocket here
            console.log(`Processed ${processed}/${total} files`);
        });

        return NextResponse.json({ results });
    } catch (error) {
        console.error('File processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process files' },
            { status: 500 }
        );
    }
} 