-- name: GetHomepageSettings :one
SELECT * FROM homepage_settings
ORDER BY updated_at DESC
LIMIT 1;

-- name: UpsertHomepageSettings :one
INSERT INTO homepage_settings (
    hero_title,
    hero_subtitle,
    hero_cta_text,
    hero_cta_link,
    about_title,
    about_content
) VALUES (
    $1, $2, $3, $4, $5, $6
)
ON CONFLICT (id) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_cta_text = EXCLUDED.hero_cta_text,
    hero_cta_link = EXCLUDED.hero_cta_link,
    about_title = EXCLUDED.about_title,
    about_content = EXCLUDED.about_content,
    updated_at = NOW()
RETURNING *;

-- name: CreateDefaultHomepageSettings :one
INSERT INTO homepage_settings (
    hero_title,
    hero_subtitle,
    hero_cta_text,
    hero_cta_link,
    about_title,
    about_content
) VALUES (
    'Welcome',
    'Your digital space',
    'Explore',
    '/articles',
    'About',
    'Tell your story here'
)
RETURNING *;
