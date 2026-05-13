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

-- name: DeleteTag :exec
DELETE FROM tags
WHERE id = $1;
