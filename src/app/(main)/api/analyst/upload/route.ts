import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'text/plain',
  'text/csv'
];

export async function POST(req: Request) {
  try {
    // Using a hardcoded user ID since we're not using authentication
    const userId = "default-user";
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: PDF, DOCX, TXT, CSV` 
      }, { status: 400 });
    }

    console.log('Uploading file:', file.name, 'Type:', file.type);

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      contentType: file.type
    });

    console.log('File uploaded to:', blob.url);

    // Store file metadata in database
    const [fileRecord] = await db.insert(files).values({
      filename: file.name,
      contentType: file.type,
      url: blob.url,
      userId,
    }).returning();

    console.log('File record created:', fileRecord);

    // Verify the file is accessible
    try {
      const checkResponse = await fetch(blob.url);
      if (!checkResponse.ok) {
        throw new Error(`File not accessible: ${checkResponse.status}`);
      }
      console.log('File accessibility verified');
    } catch (error) {
      console.error('File accessibility check failed:', error);
      throw new Error('Uploaded file is not accessible');
    }

    return NextResponse.json(fileRecord);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}