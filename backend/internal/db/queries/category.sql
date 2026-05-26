-- name: CreateCategory :one
INSERT INTO categories (name, slug, description)
VALUES ($1, $2, $3)
RETURNING id, name, slug, description, created_at, updated_at;

-- name: GetCategoryBySlug :one
SELECT id, name, slug, description, created_at, updated_at
FROM categories
WHERE slug = $1;

-- name: GetCategoryByID :one
SELECT id, name, slug, description, created_at, updated_at
FROM categories
WHERE id = $1;

-- name: ListCategories :many
SELECT id, name, slug, description, created_at, updated_at
FROM categories
ORDER BY name;

-- name: ListCategoriesWithCount :many
SELECT
  c.id,
  c.name,
  c.slug,
  c.description,
  c.created_at,
  c.updated_at,
  COALESCE(COUNT(a.id) FILTER (WHERE a.status = 'published'), 0) AS article_count
FROM categories c
LEFT JOIN articles a ON a.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.description, c.created_at, c.updated_at
ORDER BY c.name;

-- name: UpdateCategory :one
UPDATE categories
SET name = $2, slug = $3, description = $4
WHERE id = $1
RETURNING id, name, slug, description, created_at, updated_at;

-- name: DeleteCategory :exec
DELETE FROM categories
WHERE id = $1;
