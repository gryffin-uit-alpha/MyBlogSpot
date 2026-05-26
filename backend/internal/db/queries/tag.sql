-- name: CreateTag :one
INSERT INTO tags (name, slug)
VALUES ($1, $2)
RETURNING id, name, slug, created_at;

-- name: GetTagBySlug :one
SELECT id, name, slug, created_at
FROM tags
WHERE slug = $1;

-- name: GetTagByID :one
SELECT id, name, slug, created_at
FROM tags
WHERE id = $1;

-- name: GetTagByName :one
SELECT id, name, slug, created_at
FROM tags
WHERE name = $1;

-- name: ListTags :many
SELECT id, name, slug, created_at
FROM tags
ORDER BY name;

-- name: ListTagsWithCount :many
SELECT
  t.id,
  t.name,
  t.slug,
  t.created_at,
  COALESCE(COUNT(a.id) FILTER (WHERE a.status = 'published'), 0) AS article_count
FROM tags t
LEFT JOIN article_tags at ON at.tag_id = t.id
LEFT JOIN articles a ON a.id = at.article_id
GROUP BY t.id, t.name, t.slug, t.created_at
ORDER BY t.name;

-- name: DeleteTag :exec
DELETE FROM tags
WHERE id = $1;

-- name: UpdateTag :one
UPDATE tags
SET name = $2, slug = $3
WHERE id = $1
RETURNING id, name, slug, created_at;
