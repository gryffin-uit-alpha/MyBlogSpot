package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/cache"
	"github.com/gryffin-uit-alpha/myblogspot/internal/config"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/middleware"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()

	// Initialize database connection
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Test database connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connection established")

	// Initialize Redis cache connection
	redisClient := cache.NewRedisClient(cfg.Redis)
	if redisClient != nil {
		defer redisClient.Close()
	}
	appCache := cache.NewRedisCache(redisClient)

	// Initialize queries and services
	queries := db.New(pool)
	articleService := service.NewArticleService(queries, appCache)
	categoryService := service.NewCategoryService(queries, appCache)
	tagService := service.NewTagService(queries, appCache)
	searchService := service.NewSearchService(queries)
	commentService := service.NewCommentService(queries)
	adminService := service.NewAdminService(queries, cfg.JWT.Secret)

	// Bootstrap initial admin account if configured (via Secret / Environment)
	if cfg.Admin.InitialUsername != "" && cfg.Admin.InitialPassword != "" {
		if err := adminService.BootstrapInitialAdmin(ctx, cfg.Admin.InitialUsername, cfg.Admin.InitialPassword, cfg.Admin.InitialEmail); err != nil {
			log.Printf("⚠️ Warning: failed to bootstrap initial admin: %v", err)
		} else {
			log.Printf("👤 Initial admin bootstrap verified for user: %s", cfg.Admin.InitialUsername)
		}
	}
	imageService := service.NewImageService(queries, "./uploads", cfg.BaseURL)
	homepageService := service.NewHomepageService(queries)
	sessionService := service.NewSessionService(queries)

	// Initialize handlers
	articleHandler := handler.NewArticleHandler(articleService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	categoryHandler.ArticleService = articleService // For getting articles by category
	tagHandler := handler.NewTagHandler(tagService)
	searchHandler := handler.NewSearchHandler(searchService)
	commentHandler := handler.NewCommentHandler(commentService)
	adminHandler := handler.NewAdminHandler(adminService)
	imageHandler := handler.NewImageHandler(imageService)
	homepageHandler := handler.NewHomepageHandler(homepageService)
	healthHandler := handler.NewHealthHandler(pool, redisClient)
	feedHandler := handler.NewFeedHandler(articleService, cfg.BaseURL)
	sitemapHandler := handler.NewSitemapHandler(articleService, categoryService, tagService, cfg.BaseURL)

	// Setup router
	r := chi.NewRouter()

	// Observability & Telemetry Middleware (Prometheus RED Metrics)
	r.Use(middleware.PrometheusMiddleware)

	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.CORS.AllowedOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimit.Requests))
	r.Use(middleware.CacheControl())
	r.Use(middleware.SessionMiddleware(sessionService))

	// Kubernetes Health Probes & Observability Endpoints
	r.Get("/livez", healthHandler.LivezHandler)   // Liveness Probe
	r.Get("/readyz", healthHandler.ReadyzHandler) // Readiness Probe
	r.Get("/health", healthHandler.Check)        // Diagnostic Health
	r.Handle("/metrics", middleware.MetricsHandler()) // Prometheus Scrape Target

	// RSS feed and sitemap
	r.Get("/feed.xml", feedHandler.RSS)
	r.Get("/sitemap.xml", sitemapHandler.Sitemap)

	// Static file serving for uploads
	fileServer := http.FileServer(http.Dir("./uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))

	// Register API routes for both /api/v1 and root / (ensures full frontend compatibility)
	registerAPIRoutes := func(api chi.Router) {
		// Article routes
		api.Get("/articles", articleHandler.ListArticles)
		api.Get("/articles/{slug}", articleHandler.GetArticle)
		api.Post("/articles/{id}/view", articleHandler.TrackView)

		// Category routes
		api.Get("/categories", categoryHandler.ListCategories)
		api.Get("/categories/{slug}", categoryHandler.GetCategory)
		api.Get("/categories/{slug}/articles", categoryHandler.GetCategoryArticles)

		// Tag routes
		api.Get("/tags", tagHandler.ListTags)
		api.Get("/tags/{slug}", tagHandler.GetTag)
		api.Get("/tags/{slug}/articles", tagHandler.GetTagArticles)

		// Search route
		api.Get("/search", searchHandler.Search)

		// Comment routes (public)
		api.Get("/articles/{slug}/comments", commentHandler.ListComments)
		api.Post("/articles/{slug}/comments", commentHandler.CreateComment)

		// Related articles (public)
		api.Get("/articles/{slug}/related", articleHandler.GetRelatedArticles)

		// Homepage routes (public)
		api.Get("/homepage", homepageHandler.GetSettings)

		// Admin routes
		api.Post("/admin/login", adminHandler.Login)

		// Protected admin routes
		api.Group(func(admin chi.Router) {
			admin.Use(middleware.Auth(cfg.JWT.Secret))

			// Admin article management
			admin.Get("/admin/articles", articleHandler.ListAllArticles)
			admin.Get("/admin/articles/{id}", articleHandler.GetArticleByID)
			admin.Post("/admin/articles", articleHandler.CreateArticle)
			admin.Put("/admin/articles/{id}", articleHandler.UpdateArticle)
			admin.Delete("/admin/articles/{id}", articleHandler.DeleteArticle)

			// Admin comment moderation
			admin.Get("/admin/comments", commentHandler.ListAllComments)
			admin.Get("/admin/articles/{id}/comments", commentHandler.ListCommentsByArticleID)
			admin.Put("/admin/comments/{id}/approve", commentHandler.ApproveComment)
			admin.Delete("/admin/comments/{id}", commentHandler.DeleteComment)

			// Admin category management
			admin.Post("/admin/categories", categoryHandler.CreateCategory)
			admin.Put("/admin/categories/{id}", categoryHandler.UpdateCategory)
			admin.Delete("/admin/categories/{id}", categoryHandler.DeleteCategory)

			// Admin tag management
			admin.Post("/admin/tags", tagHandler.CreateTag)
			admin.Put("/admin/tags/{id}", tagHandler.UpdateTag)
			admin.Delete("/admin/tags/{id}", tagHandler.DeleteTag)

			// Admin image management
			admin.Post("/admin/images", imageHandler.UploadImage)
			admin.Get("/admin/images", imageHandler.ListImages)
			admin.Delete("/admin/images/{id}", imageHandler.DeleteImage)

			// Admin homepage management
			admin.Put("/admin/homepage", homepageHandler.UpdateSettings)
		})
	}

	// Mount routes under /api/v1 AND root / for seamless compatibility
	r.Route("/api/v1", registerAPIRoutes)
	r.Group(registerAPIRoutes)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Run HTTP server in a separate goroutine
	go func() {
		log.Printf("🚀 MyBlogSpot Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe error: %v", err)
		}
	}()

	// Listen for OS interrupt signals (SIGINT / SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	log.Printf("🛑 Received signal [%v]. Initiating graceful shutdown...", sig)

	// Context with timeout to finish in-flight requests
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown with error: %v", err)
	}

	log.Println("✅ MyBlogSpot Server shut down gracefully.")
}
