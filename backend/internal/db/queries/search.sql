-- name: SearchArticles :many
SELECT
    id, title, slug, summary,
    category_id, view_count, published_at, created_at,
    (
        ts_rank(search_vector, websearch_to_tsquery('english', $1)) * 2 +
        CASE WHEN title ILIKE '%' || $1 || '%' THEN 1.0 ELSE 0.0 END +
        CASE WHEN summary ILIKE '%' || $1 || '%' THEN 0.5 ELSE 0.0 END
    )::float8 as rank
FROM articles
WHERE status = 'published'
  AND (
    search_vector @@ websearch_to_tsquery('english', $1)
    OR title ILIKE '%' || $1 || '%'
    OR summary ILIKE '%' || $1 || '%'
    OR content ILIKE '%' || $1 || '%'
  )
ORDER BY rank DESC, published_at DESC
LIMIT $2 OFFSET $3;

-- name: CountSearchArticles :one
SELECT COUNT(*)
FROM articles
WHERE status = 'published'
  AND (
    search_vector @@ websearch_to_tsquery('english', $1)
    OR title ILIKE '%' || $1 || '%'
    OR summary ILIKE '%' || $1 || '%'
    OR content ILIKE '%' || $1 || '%'
  );

