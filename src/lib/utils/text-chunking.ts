export type FileWithContent = {
    filename: string;
    url: string;
    content?: string;
}

/**
 * Clean text before chunking to remove unnecessary whitespace and formatting
 */
const cleanText = (text: string): string => {
    return text
        .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
        .replace(/\n+/g, '\n')       // Replace multiple newlines with single newline
        .trim();
}

/**
 * Optimized text chunking for large documents
 */
export const chunkText = (text: string): string[] => {
    if (!text) return [];
    
    const CHUNK_SIZE = 8000;
    const chunks: string[] = [];
    
    // Clean the text first
    const cleanedText = cleanText(text);
    
    // Simple chunking by character count
    for (let i = 0; i < cleanedText.length; i += CHUNK_SIZE) {
        chunks.push(cleanedText.slice(i, i + CHUNK_SIZE));
    }
    
    return chunks;
}

/**
 * Creates a summarized context from file chunks
 */
export const createFileContext = (files: FileWithContent[]): string => {
    if (!files || files.length === 0) return '';
    
    const fileContexts = files.map(file => ({
        filename: file.filename,
        url: file.url,
        chunks: chunkText(file.content || ''),
    }));

    return fileContexts.map(fc => 
        `File: ${fc.filename}\nURL: ${fc.url}\nChunks: ${fc.chunks.length}\n\nContent:\n${fc.chunks.join('\n---\n')}`
    ).join('\n\n==========\n\n');
} 