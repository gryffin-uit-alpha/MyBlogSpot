-- Seed initial admin, categories, and tags


-- Seed categories
INSERT INTO categories (name, slug, description) VALUES
    ('DevOps', 'devops', 'DevOps practices, tools, and infrastructure automation'),
    ('Backend Engineering', 'backend-engineering', 'Backend development, APIs, and system design'),
    ('Infrastructure', 'infrastructure', 'Infrastructure experiments, cloud platforms, and architecture'),
    ('Personal', 'personal', 'Personal stories, experiences, and reflections')
ON CONFLICT (slug) DO NOTHING;

-- Seed tags
INSERT INTO tags (name, slug) VALUES
    ('Go', 'go'),
    ('PostgreSQL', 'postgresql'),
    ('Docker', 'docker'),
    ('Kubernetes', 'kubernetes'),
    ('AWS', 'aws'),
    ('Next.js', 'nextjs'),
    ('API Design', 'api-design'),
    ('Performance', 'performance'),
    ('Critical', 'critical'),
    ('Ambient', 'ambient'),
    ('Overclock', 'overclock')
ON CONFLICT (slug) DO NOTHING;

