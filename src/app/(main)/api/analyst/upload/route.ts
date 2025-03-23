import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    // Using a hardcoded user ID since we're not using authentication
    const userId = "default-user";
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Store file metadata in database
    const [fileRecord] = await db.insert(files).values({
      filename: file.name,
      contentType: file.type,
      url: blob.url,
      userId,
    }).returning();

    return NextResponse.json(fileRecord);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}