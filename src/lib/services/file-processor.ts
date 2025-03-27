import { RateLimiter } from '../utils/rate-limiter';
import { BatchProcessor } from '../utils/batch-processor';
import { chunkText } from '../utils/text-chunking';

interface FileInput {
    id: string;
    size: number;
    url: string;
    contentType: string;
}

interface ProcessingResult {
    fileId: string;
    success: boolean;
    error?: FileProcessingError;
    chunks?: number;
}

interface FileProcessingError {
    code: string;
    message: string;
    details?: string;
}

export class FileProcessor {
    private rateLimiter: RateLimiter;
    private static readonly TIMEOUT = 60000; // Increased to 60 seconds
    private static readonly MAX_PARALLEL = 2; // Reduced to 2 for stability

    constructor() {
        this.rateLimiter = new RateLimiter();
    }

    private async extractPdfContent(arrayBuffer: ArrayBuffer): Promise<string> {
        const pdfjsLib = await import('pdfjs-dist');
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let content = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map((item: any) => item.str).join(' ') + '\\n';
        }
        
        return content;
    }

    private async extractDocxContent(arrayBuffer: ArrayBuffer): Promise<string> {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    }

    public async processFiles(
        files: FileInput[],
        onProgress?: (processed: number, total: number) => void
    ): Promise<ProcessingResult[]> {
        try {
            const results = await BatchProcessor.processBatches(
                files,
                async (batch) => {
                    return await this.processBatchWithTimeout(batch);
                },
                onProgress
            );
            return results as ProcessingResult[];
        } catch (error) {
            throw this.handleProcessingError(error);
        }
    }

    private async processBatchWithTimeout(
        batch: FileInput[]
    ): Promise<ProcessingResult[]> {
        return Promise.race([
            this.processFileBatch(batch),
            new Promise<ProcessingResult[]>((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), FileProcessor.TIMEOUT)
            )
        ]);
    }

    private async processFileBatch(
        batch: FileInput[]
    ): Promise<ProcessingResult[]> {
        return await this.rateLimiter.addToQueue(
            async () => {
                const results: ProcessingResult[] = [];
                
                // Process files in parallel with a limit
                for (let i = 0; i < batch.length; i += FileProcessor.MAX_PARALLEL) {
                    const batchSlice = batch.slice(i, i + FileProcessor.MAX_PARALLEL);
                    const promises = batchSlice.map(async (file) => {
                        try {
                            const result = await Promise.race([
                                this.processFile(file),
                                new Promise<ProcessingResult>((_, reject) => 
                                    setTimeout(() => reject(new Error('Individual file timeout')), 
                                    FileProcessor.TIMEOUT / 2)
                                )
                            ]);
                            return result;
                        } catch (error) {
                            return {
                                fileId: file.id,
                                success: false,
                                error: this.handleProcessingError(error)
                            } as ProcessingResult;
                        }
                    });
                    
                    const batchResults = await Promise.all(promises);
                    results.push(...batchResults);
                    
                    // Add a small delay between parallel batches
                    if (i + FileProcessor.MAX_PARALLEL < batch.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                return results;
            },
            this.estimateTokens(batch)
        );
    }

    private async processFile(file: FileInput): Promise<ProcessingResult> {
        try {
            const response = await fetch(file.url);
            if (!response.ok) {
                throw new Error('Failed to fetch file content');
            }
            
            let content: string;
            const arrayBuffer = await response.arrayBuffer();

            // Extract content based on file type
            if (file.contentType.includes('pdf')) {
                content = await this.extractPdfContent(arrayBuffer);
            } else if (file.contentType.includes('wordprocessingml') || file.contentType.includes('docx')) {
                content = await this.extractDocxContent(arrayBuffer);
            } else {
                // Default to text extraction
                content = await response.text();
            }
            
            const chunks = chunkText(content);
            
            return {
                fileId: file.id,
                success: true,
                chunks: chunks.length
            };
        } catch (error) {
            console.error('File processing error:', error);
            return {
                fileId: file.id,
                success: false,
                error: this.handleProcessingError(error)
            };
        }
    }

    private estimateTokens(batch: FileInput[]): number {
        // Rough estimation based on file sizes
        return batch.reduce((sum, file) => sum + (file.size / 4), 0);
    }

    private handleProcessingError(error: any): FileProcessingError {
        if (error.message === 'TIMEOUT') {
            return {
                code: 'TIMEOUT',
                message: 'Processing timed out'
            };
        }

        if (error.code === 'too_big') {
            return {
                code: 'BATCH_SIZE_EXCEEDED',
                message: 'Batch size limit exceeded'
            };
        }

        if (error.message.includes('Rate limit')) {
            return {
                code: 'RATE_LIMIT',
                message: 'Rate limit reached, please try again later'
            };
        }

        return {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred',
            details: error.message
        };
    }
} 