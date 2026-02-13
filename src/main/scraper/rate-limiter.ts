export class RateLimiter {
  private lastRequest: Map<string, number> = new Map();
  private requestCount: Map<string, number> = new Map();
  private baseDelay: number;
  private maxRetries: number;

  constructor(baseDelay: number = 2000, maxRetries: number = 3) {
    this.baseDelay = baseDelay;
    this.maxRetries = maxRetries;
  }

  async waitForSlot(domain: string): Promise<void> {
    const lastTime = this.lastRequest.get(domain) || 0;
    const elapsed = Date.now() - lastTime;

    // Add jitter to avoid synchronized requests
    const jitter = Math.random() * 1000;
    const delay = Math.max(0, this.baseDelay - elapsed + jitter);

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequest.set(domain, Date.now());
    this.requestCount.set(domain, (this.requestCount.get(domain) || 0) + 1);
  }

  getBackoffDelay(attempt: number): number {
    // Exponential backoff: 2^attempt * baseDelay + jitter
    const delay = Math.pow(2, attempt) * this.baseDelay;
    const jitter = Math.random() * this.baseDelay;
    return delay + jitter;
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  setBaseDelay(delay: number): void {
    this.baseDelay = delay;
  }

  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  resetCounts(): void {
    this.requestCount.clear();
  }
}
