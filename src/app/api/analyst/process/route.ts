import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { chunkText } from '@/lib/utils/text-chunking';

// Change from default export to named export 'POST'
export async function POST(req: Request) {
    try {
        const { fileId } = await req.json();
        
        // Get file from database
        const [file] = await db.select()
            .from(files)
            .where(eq(files.id, fileId));
            
        if (!file) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Fetch file content from URL
        const response = await fetch(file.url);
        const content = await response.text();
        
        // Process the file content into chunks
        const chunks = chunkText(content);

        return NextResponse.json({ 
            success: true,
            chunks: chunks.length,
            filename: file.filename
        });
    } catch (error) {
        console.error('Error processing file:', error);
        return NextResponse.json(
            { error: 'Failed to process file' },
            { status: 500 }
        );
    }
} 