export type FileWithContent = {
    filename: string;
    url: string;
    content?: string;
}

/**
 * Preprocessing to reduce token usage while preserving meaning
 */
const preprocessText = (text: string): string => {
    return text
        // Basic cleanup
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\f/g, '\n')
        // Remove excessive whitespace but preserve structure
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        // Remove common non-informative patterns
        .replace(/^[\s\u00A0]+|[\s\u00A0]+$/gm, '') // Remove leading/trailing whitespace
        .replace(/(?<=\n)\s+(?=\n)/g, '') // Remove whitespace between newlines
        .replace(/\(\s*\)/g, '') // Remove empty parentheses
        .replace(/\[\s*\]/g, '') // Remove empty brackets
        .replace(/\{\s*\}/g, '') // Remove empty braces
        .replace(/"{2,}/g, '"') // Replace multiple quotes with single
        .replace(/'{2,}/g, "'") // Replace multiple apostrophes with single
        // News-specific cleanup
        .replace(/(?:\b(?:Follow|Like|Share|Subscribe)\b.*?\n)/gi, '') // Remove social media prompts
        .replace(/(?:©|\(c\)|copyright).*?(?:\d{4}|\n)/gi, '') // Remove copyright notices
        .replace(/(?:Related:|Read more:|Also read:).*?\n/gi, '') // Remove related article prompts
        .replace(/(?:Advertisement|Sponsored Content|Ad).*?\n/gi, '') // Remove ad markers
        .replace(/By\s+[\w\s]+\s*\|\s*[A-Za-z\s]+\s*\|\s*Published.*?\n/gi, '') // Remove bylines
        .replace(/\[.*?@.*?\]/g, '') // Remove social media handles
        .replace(/\b(?:http|https):\/\/\S+/g, '') // Remove URLs
        .replace(/[^\S\n]+/g, ' ') // Normalize spaces (preserve newlines)
        .trim();
}

/**
 * Estimates token count for a string
 * This is a rough estimate: 1 token ≈ 4 chars for English text
 */
const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
}

/**
 * Finds the best position to split text that minimizes context loss
 */
const findSplitPosition = (text: string, targetPosition: number, range: number = 100): number => {
    // Priority split points (in order of preference)
    const splitPoints = [
        /\n\s*\n/g,      // Paragraph breaks
        /[.!?]\s+/g,     // Sentence endings
        /[,:;]\s+/g,     // Clause boundaries
        /\s+/g           // Word boundaries (last resort)
    ];

    const start = Math.max(0, targetPosition - range);
    const end = Math.min(text.length, targetPosition + range);
    const searchText = text.slice(start, end);

    for (const pattern of splitPoints) {
        const matches = [...searchText.matchAll(pattern)];
        if (matches.length > 0) {
            // Find the split point closest to target position
            const splitIndex = matches.reduce((best, match) => {
                const position = start + match.index!;
                return Math.abs(position - targetPosition) < Math.abs(best - targetPosition) 
                    ? position 
                    : best;
            }, start);
            return splitIndex;
        }
    }

    // If no good split point found, return the target position
    return targetPosition;
}

/**
 * Optimized text chunking for large documents with intelligent token management
 * Targets ~400 tokens per chunk with smart boundary detection
 */
export const chunkText = (text: string): string[] => {
    if (!text) {
        console.log('No text provided for chunking');
        return [];
    }
    
    console.log('Original text length:', text.length);
    
    // Target ~400 tokens (≈1600 chars) for better token efficiency
    const TARGET_TOKENS = 400;
    const OVERLAP_TOKENS = 50;
    const chunks: string[] = [];
    
    // Preprocess the text
    const processedText = preprocessText(text);
    console.log('Processed text length:', processedText.length);
    
    let position = 0;
    let lastChunkEnd = 0;
    
    while (position < processedText.length) {
        // Calculate target chunk size
        const remainingText = processedText.slice(position);
        const targetSize = Math.min(
            TARGET_TOKENS * 4,
            remainingText.length
        );
        
        // Find optimal split position
        const splitPos = findSplitPosition(
            remainingText,
            targetSize,
            Math.floor(TARGET_TOKENS * 0.2) * 4 // 20% of target size as search range
        );
        
        // Extract chunk with overlap
        const chunkStart = Math.max(0, position - (OVERLAP_TOKENS * 4));
        const chunk = processedText.slice(chunkStart, position + splitPos).trim();
        
        if (chunk) {
            chunks.push(chunk);
            lastChunkEnd = position + splitPos;
            position = lastChunkEnd;
        } else {
            // Fallback: force split if no good boundary found
            const forceSplit = Math.min(position + (TARGET_TOKENS * 4), processedText.length);
            chunks.push(processedText.slice(position, forceSplit).trim());
            position = forceSplit;
        }
    }
    
    console.log('Created chunks:', chunks.length);
    if (chunks.length > 0) {
        const avgTokens = Math.round(
            chunks.reduce((sum, chunk) => sum + estimateTokens(chunk), 0) / chunks.length
        );
        console.log('Average tokens per chunk:', avgTokens);
    }
    
    return chunks;
}

/**
 * Creates a summarized context from file chunks with minimal token usage
 */
export const createFileContext = (files: FileWithContent[]): string => {
    if (!files || files.length === 0) return '';
    
    const fileContexts = files.map(file => ({
        filename: file.filename,
        chunks: chunkText(file.content || ''),
    }));

    return fileContexts.map(fc => 
        `File: ${fc.filename}\nChunks: ${fc.chunks.length}\n\nContent:\n${fc.chunks.join('\n---\n')}`
    ).join('\n\n==========\n\n');
} 