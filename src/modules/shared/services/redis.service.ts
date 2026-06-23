import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * @description Shared Redis service for caching and session management.
 * Connects to the Redis/Memurai instance on startup.
 * Gracefully handles connection failures for development environments.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password') || '';

    const url = password
      ? `redis://:${password}@${host}:${port}`
      : `redis://${host}:${port}`;

    this.logger.log(`Connecting to Redis at ${host}:${port}`);

    try {
      this.client = createClient({
        url,
        disableClientInfo: true,
      });

      this.client.on('error', () => {
        if (this.isConnected) {
          this.logger.warn('Redis connection lost. Caching will be disabled.');
          this.isConnected = false;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client successfully connected');
      });

      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timed out')), 3000);
      });
      await Promise.race([connectPromise, timeoutPromise]);
    } catch {
      this.logger.warn('Redis unavailable. Caching will be disabled.');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.logger.log('Redis client successfully disconnected');
    }
  }

  /**
   * @description Deletes a key from Redis cache.
   * @param key The cache key to invalidate.
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.logger.debug(
        `Redis not connected, skipping cache eviction for: ${key}`,
      );
      return;
    }
    try {
      await this.client.del(key);
      this.logger.log(`Evicted Redis cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to evict Redis key: ${key}`, error);
    }
  }

  /**
   * @description Sets a key-value pair in Redis.
   * @param key The key to set.
   * @param value The serialized value.
   * @param ttlSeconds Optional Time-To-Live in seconds.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.logger.debug(`Redis not connected, skipping cache set for: ${key}`);
      return;
    }
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { EX: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set Redis key: ${key}`, error);
    }
  }

  /**
   * @description Retrieves a value from Redis by key.
   * @param key The key to retrieve.
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      this.logger.debug(`Redis not connected, skipping cache get for: ${key}`);
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Failed to get Redis key: ${key}`, error);
      return null;
    }
  }
}
