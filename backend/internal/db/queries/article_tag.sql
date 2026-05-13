-- name: AddArticleTag :exec
INSERT INTO article_tags (article_id, tag_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveArticleTag :exec
DELETE FROM article_tags
WHERE article_id = $1 AND tag_id = $2;

-- name: RemoveAllArticleTags :exec
DELETE FROM article_tags
WHERE article_id = $1;

-- name: GetArticleTags :many
SELECT t.* FROM tags t
INNER JOIN article_tags at ON t.id = at.tag_id
WHERE at.article_id = $1
ORDER BY t.name;

-- name: GetTagArticles :many
SELECT a.id, a.title, a.slug, a.summary, a.content, a.category_id, a.status, a.view_count, a.published_at, a.created_at, a.updated_at
FROM articles a
INNER JOIN article_tags at ON a.id = at.article_id
WHERE at.tag_id = $1 AND a.status = 'published'
ORDER BY a.published_at DESC
LIMIT $2 OFFSET $3;
