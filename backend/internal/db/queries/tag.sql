-- name: CreateTag :one
INSERT INTO tags (name, slug)
VALUES ($1, $2)
RETURNING *;

-- name: GetTagBySlug :one
SELECT * FROM tags
WHERE slug = $1;

-- name: GetTagByID :one
SELECT * FROM tags
WHERE id = $1;

-- name: GetTagByName :one
SELECT * FROM tags
WHERE name = $1;

-- name: ListTags :many
SELECT * FROM tags
ORDER BY name;

-- name: DeleteTag :exec
DELETE FROM tags
WHERE id = $1;
