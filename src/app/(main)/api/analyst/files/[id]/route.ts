import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    
    // Get the file to delete
    const [fileToDelete] = await db.select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    
    if (!fileToDelete) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Delete from Vercel Blob
    await del(fileToDelete.url);
    
    // Delete from database
    await db.delete(files)
      .where(eq(files.id, fileId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
} 