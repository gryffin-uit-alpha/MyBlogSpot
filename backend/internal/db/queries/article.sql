-- name: CreateArticle :one
INSERT INTO articles (title, slug, summary, content, category_id, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at;

-- name: GetArticleBySlug :one
SELECT id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at
FROM articles
WHERE slug = $1 AND status = 'published';

-- name: GetArticleByID :one
SELECT id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at
FROM articles
WHERE id = $1;

-- name: ListPublishedArticles :many
SELECT id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at
FROM articles
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT $1 OFFSET $2;

-- name: ListArticlesByCategory :many
SELECT id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at
FROM articles
WHERE status = 'published' AND category_id = $1
ORDER BY published_at DESC
LIMIT $2 OFFSET $3;

-- name: ListAllArticles :many
SELECT id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at
FROM articles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateArticle :one
UPDATE articles
SET title = $2, slug = $3, summary = $4, content = $5, category_id = $6, status = $7
WHERE id = $1
RETURNING id, title, slug, summary, content, category_id, status, view_count, published_at, created_at, updated_at;

-- name: DeleteArticle :exec
DELETE FROM articles
WHERE id = $1;

-- name: PublishArticle :exec
UPDATE articles
SET status = 'published', published_at = NOW()
WHERE id = $1;

-- name: UnpublishArticle :exec
UPDATE articles
SET status = 'draft', published_at = NULL
WHERE id = $1;

-- name: IncrementViewCount :exec
UPDATE articles
SET view_count = view_count + 1
WHERE id = $1;

-- name: CountPublishedArticles :one
SELECT COUNT(*) FROM articles
WHERE status = 'published';

-- name: GetRelatedArticles :many
SELECT DISTINCT a.*
FROM articles a
LEFT JOIN article_tags at1 ON a.id = at1.article_id
LEFT JOIN article_tags at2 ON at1.tag_id = at2.tag_id AND at2.article_id = $1
WHERE a.id != $1
  AND a.status = 'published'
  AND (at2.article_id IS NOT NULL OR a.category_id = (SELECT category_id FROM articles WHERE id = $1))
ORDER BY
  CASE WHEN at2.article_id IS NOT NULL THEN 1 ELSE 2 END,
  a.created_at DESC
LIMIT $2;
