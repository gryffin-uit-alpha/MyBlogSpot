package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gryffin-uit-alpha/myblogspot/internal/config"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/redis/go-redis/v9"
)

var (
	// CacheHits tracks total Redis cache hits
	CacheHits = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "myblogspot",
			Subsystem: "cache",
			Name:      "hits_total",
			Help:      "Total number of cache hits in Redis",
		},
		[]string{"layer"},
	)

	// CacheMisses tracks total Redis cache misses
	CacheMisses = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "myblogspot",
			Subsystem: "cache",
			Name:      "misses_total",
			Help:      "Total number of cache misses requiring DB lookup",
		},
		[]string{"layer"},
	)
)

// Cache defines high-level caching operations with graceful degradation
type Cache interface {
	Get(ctx context.Context, layer, key string, dest interface{}) bool
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	DeletePattern(ctx context.Context, pattern string) error
	Client() *redis.Client
}

// NewRedisClient creates and validates a Redis client connection
func NewRedisClient(cfg config.RedisConfig) *redis.Client {
	if !cfg.Enabled {
		log.Println("Redis is disabled by configuration")
		return nil
	}

	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  3 * time.Second,
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
		PoolSize:     10,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Warning: Redis unreachable at %s: %v. Running in degraded mode (in-memory/DB only).", addr, err)
		return client // Return client anyway so readiness probe can report status and retry
	}

	log.Printf("✅ Connected to Redis at %s", addr)
	return client
}

// RedisCache provides a production-grade Cache implementation on top of Redis
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache wraps redis.Client into a resilient Cache interface
func NewRedisCache(client *redis.Client) *RedisCache {
	return &RedisCache{client: client}
}

// Client returns underlying redis.Client
func (c *RedisCache) Client() *redis.Client {
	if c == nil {
		return nil
	}
	return c.client
}

// Get fetches and unmarshals JSON cached value. Returns true on cache HIT, false on cache MISS or error.
func (c *RedisCache) Get(ctx context.Context, layer, key string, dest interface{}) bool {
	if c == nil || c.client == nil {
		return false
	}

	val, err := c.client.Get(ctx, key).Result()
	if err != nil {
		if err != redis.Nil {
			log.Printf("⚠️ Redis Get error on key [%s]: %v", key, err)
		}
		CacheMisses.WithLabelValues(layer).Inc()
		return false
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		log.Printf("⚠️ Redis JSON unmarshal error on key [%s]: %v", key, err)
		CacheMisses.WithLabelValues(layer).Inc()
		return false
	}

	CacheHits.WithLabelValues(layer).Inc()
	return true
}

// Set serializes value to JSON and stores in Redis with given TTL
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if c == nil || c.client == nil {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal cache value: %w", err)
	}

	return c.client.Set(ctx, key, data, ttl).Err()
}

// Delete removes specific keys from cache
func (c *RedisCache) Delete(ctx context.Context, keys ...string) error {
	if c == nil || c.client == nil || len(keys) == 0 {
		return nil
	}
	return c.client.Del(ctx, keys...).Err()
}

// DeletePattern scans and deletes all keys matching given glob pattern
func (c *RedisCache) DeletePattern(ctx context.Context, pattern string) error {
	if c == nil || c.client == nil {
		return nil
	}

	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	var keys []string
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	if err := iter.Err(); err != nil {
		return err
	}

	if len(keys) > 0 {
		return c.client.Del(ctx, keys...).Err()
	}
	return nil
}
