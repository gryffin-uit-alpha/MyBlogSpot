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
	healthHandler := handler.NewHealthHandler(pool)
	feedHandler := handler.NewFeedHandler(articleService, cfg.BaseURL)
	sitemapHandler := handler.NewSitemapHandler(articleService, categoryService, tagService, cfg.BaseURL)

	// Setup router
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.CORS.AllowedOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimit.Requests))
	r.Use(middleware.CacheControl())
	r.Use(middleware.SessionMiddleware(sessionService))

	// Health check
	r.Get("/health", healthHandler.Check)

	// RSS feed and sitemap
	r.Get("/feed.xml", feedHandler.RSS)
	r.Get("/sitemap.xml", sitemapHandler.Sitemap)

	// Static file serving for uploads
	fileServer := http.FileServer(http.Dir("./uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))

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

		// Related articles (public)
		r.Get("/articles/{slug}/related", articleHandler.GetRelatedArticles)

		// Homepage routes (public)
		r.Get("/homepage", homepageHandler.GetSettings)

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
			r.Put("/admin/comments/{id}/approve", commentHandler.ApproveComment)
			r.Delete("/admin/comments/{id}", commentHandler.DeleteComment)

			// Admin category management
			r.Post("/admin/categories", categoryHandler.CreateCategory)
			r.Put("/admin/categories/{id}", categoryHandler.UpdateCategory)
			r.Delete("/admin/categories/{id}", categoryHandler.DeleteCategory)

			// Admin tag management
			r.Post("/admin/tags", tagHandler.CreateTag)
			r.Put("/admin/tags/{id}", tagHandler.UpdateTag)
			r.Delete("/admin/tags/{id}", tagHandler.DeleteTag)

			// Admin image management
			r.Post("/admin/images", imageHandler.UploadImage)
			r.Get("/admin/images", imageHandler.ListImages)
			r.Delete("/admin/images/{id}", imageHandler.DeleteImage)

			// Admin homepage management
			r.Put("/admin/homepage", homepageHandler.UpdateSettings)
		})
	})

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
