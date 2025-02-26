
import { GoogleGenerativeAI } from "@google/generative-ai";
import { chromeDb } from "@/lib/chrome-storage";
import { toast } from "sonner";

const GEMINI_STORAGE_KEY = "gemini_api_key";
const CACHE_PREFIX = "gemini_cache_";
const RATE_LIMIT_KEY = "gemini_rate_limit";
const MAX_REQUESTS_PER_MINUTE = 60;

interface RateLimit {
  count: number;
  timestamp: number;
}

class GeminiService {
  private static instance: GeminiService;
  private client: GoogleGenerativeAI | null = null;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!this.instance) {
      this.instance = new GeminiService();
    }
    return this.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const apiKey = await chromeDb.get<string>(GEMINI_STORAGE_KEY);
      if (!apiKey) {
        console.log("No API key found");
        return false;
      }

      this.client = new GoogleGenerativeAI(apiKey);
      return true;
    } catch (error) {
      console.error("Failed to initialize Gemini client:", error);
      return false;
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    try {
      await chromeDb.set(GEMINI_STORAGE_KEY, apiKey);
      this.client = new GoogleGenerativeAI(apiKey);
      toast.success("Gemini API key saved successfully");
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast.error("Failed to save API key");
      throw error;
    }
  }

  private async checkRateLimit(): Promise<boolean> {
    try {
      const now = Date.now();
      const rateLimit = await chromeDb.get<RateLimit>(RATE_LIMIT_KEY) || {
        count: 0,
        timestamp: now,
      };

      // Reset counter if more than a minute has passed
      if (now - rateLimit.timestamp > 60000) {
        await chromeDb.set(RATE_LIMIT_KEY, { count: 1, timestamp: now });
        return true;
      }

      // Check if we've exceeded the rate limit
      if (rateLimit.count >= MAX_REQUESTS_PER_MINUTE) {
        return false;
      }

      // Increment counter
      await chromeDb.set(RATE_LIMIT_KEY, {
        count: rateLimit.count + 1,
        timestamp: rateLimit.timestamp,
      });
      return true;
    } catch (error) {
      console.error("Rate limit check failed:", error);
      return false;
    }
  }

  private async getCachedResponse(key: string): Promise<string | null> {
    try {
      const cached = await chromeDb.get<{ value: string; timestamp: number }>(
        `${CACHE_PREFIX}${key}`
      );
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.value;
      }
      return null;
    } catch (error) {
      console.error("Cache retrieval failed:", error);
      return null;
    }
  }

  private async setCachedResponse(key: string, value: string): Promise<void> {
    try {
      await chromeDb.set(`${CACHE_PREFIX}${key}`, {
        value,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Cache storage failed:", error);
    }
  }

  async generateContent(
    prompt: string,
    options: {
      useCache?: boolean;
      model?: string;
    } = {}
  ): Promise<string> {
    const { useCache = true, model = "gemini-pro" } = options;

    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error("Gemini client not initialized. Please set API key in settings.");
        }
      }

      // Check cache first if enabled
      if (useCache) {
        const cached = await this.getCachedResponse(prompt);
        if (cached) {
          console.log("Using cached response");
          return cached;
        }
      }

      // Check rate limit
      const canProceed = await this.checkRateLimit();
      if (!canProceed) {
        throw new Error("Rate limit exceeded. Please try again in a minute.");
      }

      // Generate content
      const genModel = this.client!.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Cache the response if caching is enabled
      if (useCache) {
        await this.setCachedResponse(prompt, text);
      }

      return text;
    } catch (error) {
      console.error("Content generation failed:", error);
      throw error;
    }
  }
}

export const geminiService = GeminiService.getInstance();
