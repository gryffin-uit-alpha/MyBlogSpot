package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// HTTPRequestsTotal counts incoming HTTP requests partitioned by method, path, and response code
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "myblogspot",
			Subsystem: "http",
			Name:      "requests_total",
			Help:      "Total number of HTTP requests processed by MyBlogSpot",
		},
		[]string{"method", "path", "status"},
	)

	// HTTPRequestDuration tracks request processing duration in seconds (Histogram for p50, p95, p99)
	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "myblogspot",
			Subsystem: "http",
			Name:      "request_duration_seconds",
			Help:      "HTTP request latency distributions in seconds",
			Buckets:   []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		},
		[]string{"method", "path"},
	)
)

// PrometheusMiddleware intercepts Chi v5 requests and observes RED metrics
func PrometheusMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		next.ServeHTTP(ww, r)

		duration := time.Since(start).Seconds()
		path := chi.RouteContext(r.Context()).RoutePattern()
		if path == "" {
			path = r.URL.Path
		}

		statusStr := strconv.Itoa(ww.Status())
		HTTPRequestsTotal.WithLabelValues(r.Method, path, statusStr).Inc()
		HTTPRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
	})
}

// MetricsHandler returns the Prometheus standard metrics endpoint handler
func MetricsHandler() http.Handler {
	return promhttp.Handler()
}
