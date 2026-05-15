package handler

import (
	"encoding/xml"
	"net/http"
	"time"

	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
)

type FeedHandler struct {
	articleService *service.ArticleService
	baseURL        string
}

func NewFeedHandler(articleService *service.ArticleService, baseURL string) *FeedHandler {
	return &FeedHandler{
		articleService: articleService,
		baseURL:        baseURL,
	}
}

type RSS struct {
	XMLName xml.Name `xml:"rss"`
	Version string   `xml:"version,attr"`
	Channel *Channel `xml:"channel"`
}

type Channel struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	Items       []Item `xml:"item"`
}

type Item struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description,omitempty"`
	PubDate     string `xml:"pubDate"`
	GUID        string `xml:"guid"`
}

func (h *FeedHandler) RSS(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get recent published articles (last 50)
	articles, _, err := h.articleService.ListPublished(ctx, 50, 0)
	if err != nil {
		http.Error(w, "Failed to generate feed", http.StatusInternalServerError)
		return
	}

	items := make([]Item, len(articles))
	for i, article := range articles {
		pubDate := ""
		if article.PublishedAt != nil {
			pubDate = article.PublishedAt.Format(time.RFC1123Z)
		}

		summary := ""
		if article.Summary != nil {
			summary = *article.Summary
		}

		items[i] = Item{
			Title:       article.Title,
			Link:        h.baseURL + "/articles/" + article.Slug,
			Description: summary,
			PubDate:     pubDate,
			GUID:        h.baseURL + "/articles/" + article.Slug,
		}
	}

	feed := &RSS{
		Version: "2.0",
		Channel: &Channel{
			Title:       "MyBlogSpot",
			Link:        h.baseURL,
			Description: "Personal blog for technical writing and knowledge sharing",
			Items:       items,
		},
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600") // Cache for 1 hour

	w.WriteHeader(http.StatusOK)
	xml.NewEncoder(w).Encode(feed)
}
