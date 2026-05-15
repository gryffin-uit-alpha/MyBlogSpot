package handler

import (
	"encoding/xml"
	"net/http"

	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
)

type SitemapHandler struct {
	articleService  *service.ArticleService
	categoryService *service.CategoryService
	tagService      *service.TagService
	baseURL         string
}

func NewSitemapHandler(
	articleService *service.ArticleService,
	categoryService *service.CategoryService,
	tagService *service.TagService,
	baseURL string,
) *SitemapHandler {
	return &SitemapHandler{
		articleService:  articleService,
		categoryService: categoryService,
		tagService:      tagService,
		baseURL:         baseURL,
	}
}

type URLSet struct {
	XMLName xml.Name `xml:"urlset"`
	XMLNS   string   `xml:"xmlns,attr"`
	URLs    []URL    `xml:"url"`
}

type URL struct {
	Loc        string  `xml:"loc"`
	LastMod    string  `xml:"lastmod,omitempty"`
	ChangeFreq string  `xml:"changefreq,omitempty"`
	Priority   float64 `xml:"priority,omitempty"`
}

func (h *SitemapHandler) Sitemap(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var urls []URL

	// Homepage
	urls = append(urls, URL{
		Loc:        h.baseURL,
		ChangeFreq: "daily",
		Priority:   1.0,
	})

	// Articles
	articles, _, err := h.articleService.ListPublished(ctx, 1000, 0)
	if err == nil {
		for _, article := range articles {
			lastMod := ""
			if article.PublishedAt != nil {
				lastMod = article.PublishedAt.Format("2006-01-02")
			}

			urls = append(urls, URL{
				Loc:        h.baseURL + "/articles/" + article.Slug,
				LastMod:    lastMod,
				ChangeFreq: "weekly",
				Priority:   0.8,
			})
		}
	}

	// Categories
	categories, err := h.categoryService.List(ctx)
	if err == nil {
		for _, category := range categories {
			urls = append(urls, URL{
				Loc:        h.baseURL + "/categories/" + category.Slug,
				ChangeFreq: "weekly",
				Priority:   0.6,
			})
		}
	}

	// Tags
	tags, err := h.tagService.List(ctx)
	if err == nil {
		for _, tag := range tags {
			urls = append(urls, URL{
				Loc:        h.baseURL + "/tags/" + tag.Slug,
				ChangeFreq: "weekly",
				Priority:   0.5,
			})
		}
	}

	sitemap := &URLSet{
		XMLNS: "http://www.sitemaps.org/schemas/sitemap/0.9",
		URLs:  urls,
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600") // Cache for 1 hour

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(xml.Header))
	xml.NewEncoder(w).Encode(sitemap)
}
