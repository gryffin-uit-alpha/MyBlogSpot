-- name: SearchArticles :many
SELECT
    id, title, slug, summary,
    category_id, view_count, published_at, created_at,
    0 as rank
FROM articles
WHERE status = 'published'
    AND title ILIKE '%' || $1 || '%'
ORDER BY published_at DESC
LIMIT $2 OFFSET $3;
