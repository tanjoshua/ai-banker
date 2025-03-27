import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { chunkText } from '@/lib/utils/text-chunking';

// Change from default export to named export 'POST'
export async function POST(req: Request) {
    try {
        const { fileId } = await req.json();
        console.log('Processing file:', fileId);
        
        // Get file from database
        const [file] = await db.select()
            .from(files)
            .where(eq(files.id, fileId));
            
        if (!file) {
            console.error('File not found:', fileId);
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        console.log('Found file:', file.filename);

        // Fetch file content from URL
        console.log('Fetching from URL:', file.url);
        const response = await fetch(file.url);
        
        if (!response.ok) {
            console.error('Failed to fetch file:', response.status, response.statusText);
            throw new Error('Failed to fetch file content');
        }
        
        const content = await response.text();
        console.log('Content length:', content.length);
        
        // Process the file content into chunks
        const chunks = chunkText(content);
        console.log('Created chunks:', chunks.length);

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