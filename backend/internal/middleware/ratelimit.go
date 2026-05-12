package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	visitors = make(map[string]*visitor)
	mu       sync.Mutex
)

func RateLimit(requestsPerMin int) func(http.Handler) http.Handler {
	go cleanupVisitors()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getIP(r)
			limiter := getVisitor(ip, requestsPerMin)

			if !limiter.Allow() {
				respondJSON(w, http.StatusTooManyRequests, model.ErrorResponse("RATE_LIMIT_EXCEEDED", "Too many requests"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func getVisitor(ip string, requestsPerMin int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(rate.Limit(requestsPerMin)/60, requestsPerMin)
		visitors[ip] = &visitor{limiter, time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

func cleanupVisitors() {
	for {
		time.Sleep(time.Minute)
		mu.Lock()
		for ip, v := range visitors {
			if time.Since(v.lastSeen) > 3*time.Minute {
				delete(visitors, ip)
			}
		}
		mu.Unlock()
	}
}

func getIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}
	return r.RemoteAddr
}
