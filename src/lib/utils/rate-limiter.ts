export class RateLimiter {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private tokenCount = 0;
    private lastReset = Date.now();
    private readonly TOKEN_LIMIT = 200000; // OpenAI's limit
    private readonly RESET_INTERVAL = 60000; // 1 minute in milliseconds

    private async resetTokenCount() {
        const now = Date.now();
        if (now - this.lastReset >= this.RESET_INTERVAL) {
            this.tokenCount = 0;
            this.lastReset = now;
        }
    }

    public async addToQueue<T>(
        task: () => Promise<T>,
        estimatedTokens: number
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    await this.resetTokenCount();
                    if (this.tokenCount + estimatedTokens > this.TOKEN_LIMIT) {
                        const waitTime = this.RESET_INTERVAL - (Date.now() - this.lastReset);
                        await new Promise(r => setTimeout(r, waitTime));
                        await this.resetTokenCount();
                    }
                    this.tokenCount += estimatedTokens;
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                try {
                    await task();
                } catch (error) {
                    console.error('Task processing error:', error);
                }
            }
        }
        
        this.processing = false;
    }
} 