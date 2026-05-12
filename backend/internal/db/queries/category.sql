-- name: CreateCategory :one
INSERT INTO categories (name, slug, description)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCategoryBySlug :one
SELECT * FROM categories
WHERE slug = $1;

-- name: GetCategoryByID :one
SELECT * FROM categories
WHERE id = $1;

-- name: ListCategories :many
SELECT * FROM categories
ORDER BY name;

-- name: UpdateCategory :one
UPDATE categories
SET name = $2, slug = $3, description = $4
WHERE id = $1
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories
WHERE id = $1;
