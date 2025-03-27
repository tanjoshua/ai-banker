import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { FileProcessor } from '@/lib/services/file-processor';

export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const fileIds = Array.isArray(body.fileId) ? body.fileId : [body.fileId];
        
        console.log('Processing files:', fileIds);
        
        // Get files from database
        const filesToProcess = await db.select()
            .from(files)
            .where(eq(files.id, fileIds[0])); // TODO: Update Drizzle query to handle multiple IDs
            
        if (!filesToProcess.length) {
            console.error('No files found:', fileIds);
            return NextResponse.json(
                { error: 'No files found' },
                { status: 404 }
            );
        }

        console.log('Found files:', filesToProcess.map(f => f.filename).join(', '));

        // Convert database files to FileProcessor input format
        const fileInputs = filesToProcess.map(file => ({
            id: file.id,
            size: 0, // Default size since we don't store it
            url: file.url,
            contentType: file.contentType
        }));

        // Process files using FileProcessor service
        const processor = new FileProcessor();
        const results = await processor.processFiles(fileInputs, (processed, total) => {
            console.log(`Processing progress: ${processed}/${total} files`);
        });

        // Format response
        const response = {
            success: true,
            results: results.map(result => ({
                fileId: result.fileId,
                filename: filesToProcess.find(f => f.id === result.fileId)?.filename,
                success: result.success,
                chunks: result.chunks,
                error: result.error
            }))
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error processing files:', error);
        return NextResponse.json(
            { error: 'Failed to process files' },
            { status: 500 }
        );
    }
} 