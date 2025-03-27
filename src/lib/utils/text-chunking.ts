export type FileWithContent = {
    filename: string;
    url: string;
    content?: string;
}

/**
 * Clean text before chunking to remove unnecessary whitespace and formatting
 * while preserving important document structure
 */
const cleanText = (text: string): string => {
    return text
        .replace(/\r\n/g, '\n')       // Normalize line endings
        .replace(/\r/g, '\n')         // Replace carriage returns with newlines
        .replace(/\t/g, ' ')          // Replace tabs with spaces
        .replace(/\f/g, '\n')         // Replace form feeds with newlines
        .replace(/[ \t]+/g, ' ')      // Replace multiple spaces/tabs with single space
        .replace(/\n{3,}/g, '\n\n')   // Replace 3+ newlines with 2
        .trim();
}

/**
 * Optimized text chunking for large documents with token awareness
 * Targets ~500 tokens per chunk (≈2000 characters)
 */
export const chunkText = (text: string): string[] => {
    if (!text) {
        console.log('No text provided for chunking');
        return [];
    }
    
    console.log('Original text length:', text.length);
    
    // Target ~500 tokens per chunk (≈2000 characters)
    const CHUNK_SIZE = 2000;
    const OVERLAP = 100;
    const chunks: string[] = [];
    
    // Clean the text first
    const cleanedText = cleanText(text);
    console.log('Cleaned text length:', cleanedText.length);
    
    // Split into paragraphs first, then into sentences
    const paragraphs = cleanedText.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        // Split paragraph into sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        
        for (const sentence of sentences) {
            // If adding this sentence would exceed chunk size
            if ((currentChunk + sentence).length > CHUNK_SIZE) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    // Keep some overlap for context
                    currentChunk = currentChunk.slice(-OVERLAP) + sentence;
                } else {
                    // If the sentence itself is too long, force split it
                    const forceSplit = sentence.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];
                    chunks.push(...forceSplit.map(s => s.trim()));
                    currentChunk = forceSplit[forceSplit.length - 1] || '';
                }
            } else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
        }
        
        // Add paragraph break if we're continuing
        if (currentChunk) {
            currentChunk += '\n\n';
        }
    }
    
    // Don't forget the last chunk
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    console.log('Created chunks:', chunks.length);
    if (chunks.length > 0) {
        console.log('Average chunk size:', Math.round(chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length));
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