
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class LocalCache<T> {
  private readonly key: string;
  private readonly duration: number;

  constructor(key: string, duration: number = 24 * 60 * 60 * 1000) {
    this.key = key;
    this.duration = duration;
  }

  get(): T | null {
    try {
      const item = localStorage.getItem(this.key);
      if (!item) return null;

      const { data, timestamp }: CacheItem<T> = JSON.parse(item);
      if (Date.now() - timestamp > this.duration) {
        this.remove();
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  set(data: T): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(this.key, JSON.stringify(item));
  }

  remove(): void {
    localStorage.removeItem(this.key);
  }
}

// Create specific cache instances for different features
export const summaryCache = new LocalCache<Record<string, string>>('bookmark-summaries');
export const categoryCache = new LocalCache<Record<string, string>>('bookmark-categories');
export const contentCache = new LocalCache<Record<string, string>>('bookmark-contents', 12 * 60 * 60 * 1000); // 12 hours
