package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
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

	// Initialize queries and services
	queries := db.New(pool)
	articleService := service.NewArticleService(queries)
	categoryService := service.NewCategoryService(queries)
	tagService := service.NewTagService(queries)
	searchService := service.NewSearchService(queries)
	commentService := service.NewCommentService(queries)
	adminService := service.NewAdminService(queries, cfg.JWT.Secret)

	// Initialize handlers
	articleHandler := handler.NewArticleHandler(articleService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	categoryHandler.ArticleService = articleService // For getting articles by category
	tagHandler := handler.NewTagHandler(tagService)
	searchHandler := handler.NewSearchHandler(searchService)
	commentHandler := handler.NewCommentHandler(commentService)
	adminHandler := handler.NewAdminHandler(adminService)
	healthHandler := handler.NewHealthHandler(pool)
	feedHandler := handler.NewFeedHandler(articleService, cfg.BaseURL)
	sitemapHandler := handler.NewSitemapHandler(articleService, categoryService, tagService, cfg.BaseURL)

	// Setup router
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.CORS.AllowedOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimit.Requests))
	r.Use(middleware.CacheControl())

	// Health check
	r.Get("/health", healthHandler.Check)

	// RSS feed and sitemap
	r.Get("/feed.xml", feedHandler.RSS)
	r.Get("/sitemap.xml", sitemapHandler.Sitemap)

	// Public API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Article routes
		r.Get("/articles", articleHandler.ListArticles)
		r.Get("/articles/{slug}", articleHandler.GetArticle)
		r.Post("/articles/{id}/view", articleHandler.TrackView)

		// Category routes
		r.Get("/categories", categoryHandler.ListCategories)
		r.Get("/categories/{slug}", categoryHandler.GetCategory)
		r.Get("/categories/{slug}/articles", categoryHandler.GetCategoryArticles)

		// Tag routes
		r.Get("/tags", tagHandler.ListTags)
		r.Get("/tags/{slug}", tagHandler.GetTag)
		r.Get("/tags/{slug}/articles", tagHandler.GetTagArticles)

		// Search route
		r.Get("/search", searchHandler.Search)

		// Comment routes (public)
		r.Get("/articles/{slug}/comments", commentHandler.ListComments)
		r.Post("/articles/{slug}/comments", commentHandler.CreateComment)

		// Admin routes
		r.Post("/admin/login", adminHandler.Login)

		// Protected admin routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg.JWT.Secret))

			// Admin article management
			r.Get("/admin/articles", articleHandler.ListAllArticles)
			r.Get("/admin/articles/{id}", articleHandler.GetArticleByID)
			r.Post("/admin/articles", articleHandler.CreateArticle)
			r.Put("/admin/articles/{id}", articleHandler.UpdateArticle)
			r.Delete("/admin/articles/{id}", articleHandler.DeleteArticle)

			// Admin comment moderation
			r.Get("/admin/comments", commentHandler.ListAllComments)
			r.Get("/admin/articles/{id}/comments", commentHandler.ListCommentsByArticleID)
			r.Delete("/admin/comments/{id}", commentHandler.DeleteComment)
		})
	})

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
