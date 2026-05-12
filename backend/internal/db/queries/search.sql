-- name: SearchArticles :many
SELECT
    id, title, slug, summary,
    category_id, view_count, published_at, created_at,
    ts_rank(search_vector, to_tsquery('english', $1)) as rank
FROM articles
WHERE status = 'published'
    AND search_vector @@ to_tsquery('english', $1)
ORDER BY rank DESC, published_at DESC
LIMIT $2 OFFSET $3;
