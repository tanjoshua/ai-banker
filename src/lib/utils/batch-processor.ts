export class BatchProcessor {
    private static readonly BATCH_SIZE = 20;
    
    static async processBatches<T>(
        items: T[],
        processFn: (batch: T[]) => Promise<any>,
        onProgress?: (processed: number, total: number) => void
    ): Promise<any[]> {
        const results: any[] = [];
        const batches = this.createBatches(items);
        
        for (let i = 0; i < batches.length; i++) {
            try {
                const result = await processFn(batches[i]);
                results.push(...result);
                
                if (onProgress) {
                    onProgress((i + 1) * this.BATCH_SIZE, items.length);
                }
            } catch (error) {
                console.error(`Error processing batch ${i + 1}:`, error);
                // Continue with next batch instead of failing completely
            }
            
            // Add delay between batches to respect rate limits
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return results;
    }
    
    private static createBatches<T>(items: T[]): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
            batches.push(items.slice(i, i + this.BATCH_SIZE));
        }
        return batches;
    }
} 