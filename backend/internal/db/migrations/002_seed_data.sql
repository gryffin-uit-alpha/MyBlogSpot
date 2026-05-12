-- +goose Up
-- Seed admin account (username: admin, password: changeme)
INSERT INTO admins (username, password_hash, email)
VALUES (
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYXqK0M5V0q',
    'admin@myblogspot.local'
);

-- Seed categories
INSERT INTO categories (name, slug, description) VALUES
    ('DevOps', 'devops', 'DevOps practices, tools, and infrastructure automation'),
    ('Backend Engineering', 'backend-engineering', 'Backend development, APIs, and system design'),
    ('Infrastructure', 'infrastructure', 'Infrastructure experiments, cloud platforms, and architecture'),
    ('Personal', 'personal', 'Personal stories, experiences, and reflections');

-- Seed tags
INSERT INTO tags (name, slug) VALUES
    ('Go', 'go'),
    ('PostgreSQL', 'postgresql'),
    ('Docker', 'docker'),
    ('Kubernetes', 'kubernetes'),
    ('AWS', 'aws'),
    ('Next.js', 'nextjs'),
    ('API Design', 'api-design'),
    ('Performance', 'performance');

-- +goose Down
DELETE FROM tags WHERE slug IN ('go', 'postgresql', 'docker', 'kubernetes', 'aws', 'nextjs', 'api-design', 'performance');
DELETE FROM categories WHERE slug IN ('devops', 'backend-engineering', 'infrastructure', 'personal');
DELETE FROM admins WHERE username = 'admin';
