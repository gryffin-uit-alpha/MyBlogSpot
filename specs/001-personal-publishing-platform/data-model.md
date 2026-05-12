# Data Model: MyBlogSpot

**Date**: 2026-05-12  
**Feature**: Personal Publishing Platform  
**Purpose**: Define database schema, entity relationships, and validation rules

---

## Entity-Relationship Overview

```
┌──────────┐         ┌──────────────┐         ┌───────────┐
│  Admin   │         │   Article    │         │ Category  │
└──────────┘         └──────────────┘         └───────────┘
                            │ 1
                            │
                            │ N
                     ┌──────────────┐
                     │ ArticleTag   │
                     └──────────────┘
                            │ N
                            │
                            │ 1
                     ┌──────────────┐
                     │     Tag      │
                     └──────────────┘

┌──────────────┐
│   Comment    │
└──────────────┘
       │ N
       │
       │ 1
┌──────────────┐
│   Article    │
└──────────────┘
```

---

## Entities

### 1. Admin

Represents the single administrator account for platform management.

**Table**: `admins`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique admin identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Admin login username |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password (cost 12) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Admin email (for recovery) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `last_login_at` | TIMESTAMP | NULL | Last successful login timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `username`
- Unique index on `email`

**Validation Rules**:
- Username: 3-50 characters, alphanumeric + underscore only
- Password: Minimum 12 characters (enforced at application level before hashing)
- Email: Valid email format (RFC 5322)

**Relationships**:
- One admin account per system (enforced at application level)

**Notes**:
- Password stored as bcrypt hash with cost factor 12
- `last_login_at` updated on successful authentication
- `updated_at` maintained via trigger or application logic

---

### 2. Article

Represents a blog post/article with markdown content.

**Table**: `articles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique article identifier |
| `title` | VARCHAR(255) | NOT NULL | Article title |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly slug |
| `summary` | TEXT | NULL | Short summary/excerpt (max 500 chars) |
| `content` | TEXT | NOT NULL | Full markdown content |
| `category_id` | UUID | NULL, FOREIGN KEY → categories(id) | Article category |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | Publication status: 'draft' or 'published' |
| `view_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of article views |
| `published_at` | TIMESTAMP | NULL | Publication timestamp |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `search_vector` | TSVECTOR | NULL | Full-text search vector |

**Indexes**:
- Primary key on `id`
- Unique index on `slug`
- Index on `category_id`
- Index on `status`
- Index on `published_at DESC` (for sorting)
- GIN index on `search_vector` (for full-text search)

**Validation Rules**:
- Title: 1-255 characters, required
- Slug: Lowercase, alphanumeric + hyphens, auto-generated from title if not provided
- Summary: 0-500 characters, optional
- Content: Markdown text, 1-100,000 characters
- Status: Enum ('draft', 'published')
- View count: Non-negative integer

**Relationships**:
- Many-to-one with `Category` (optional)
- One-to-many with `Comment`
- Many-to-many with `Tag` (via `article_tags`)

**State Transitions**:
```
draft → published: Sets published_at to current timestamp
published → draft: Clears published_at (unpublish)
```

**Triggers**:
```sql
-- Update search_vector when article changes
CREATE TRIGGER articles_search_vector_update
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);

-- Update updated_at timestamp
CREATE TRIGGER articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes**:
- Slug must be unique and URL-safe
- Only published articles appear on public site
- `view_count` incremented on public article page views
- `search_vector` automatically updated by trigger

---

### 3. Category

Represents a content classification (e.g., "DevOps", "Backend Engineering").

**Table**: `categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique category identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly slug |
| `description` | TEXT | NULL | Category description |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `name`
- Unique index on `slug`

**Validation Rules**:
- Name: 1-100 characters, unique
- Slug: Lowercase, alphanumeric + hyphens, auto-generated from name
- Description: 0-500 characters, optional

**Relationships**:
- One-to-many with `Article`

**Computed Fields** (application-level):
- `article_count`: Count of published articles in category (computed via JOIN)

**Notes**:
- Categories are hierarchical flat (no parent categories in v1)
- Deleting a category with articles requires reassignment or nullification

---

### 4. Tag

Represents a topic keyword for article discovery (e.g., "Go", "PostgreSQL").

**Table**: `tags`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique tag identifier |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tag name |
| `slug` | VARCHAR(50) | UNIQUE, NOT NULL | URL-friendly slug |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `name`
- Unique index on `slug`

**Validation Rules**:
- Name: 1-50 characters, unique, case-insensitive
- Slug: Lowercase, alphanumeric + hyphens, auto-generated from name

**Relationships**:
- Many-to-many with `Article` (via `article_tags`)

**Computed Fields** (application-level):
- `article_count`: Count of published articles with this tag (computed via JOIN)

**Notes**:
- Tags are created automatically when articles are tagged
- Unused tags (0 articles) may be cleaned up periodically

---

### 5. Article_Tags (Join Table)

Links articles to tags (many-to-many relationship).

**Table**: `article_tags`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `article_id` | UUID | NOT NULL, FOREIGN KEY → articles(id) ON DELETE CASCADE | Article reference |
| `tag_id` | UUID | NOT NULL, FOREIGN KEY → tags(id) ON DELETE CASCADE | Tag reference |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Relationship creation timestamp |

**Indexes**:
- Composite primary key on `(article_id, tag_id)`
- Index on `tag_id` (for reverse lookups)

**Constraints**:
- Composite unique constraint on `(article_id, tag_id)` (prevent duplicates)

**Relationships**:
- Many-to-one with `Article`
- Many-to-one with `Tag`

**Notes**:
- Deleting article or tag automatically removes join table entries (CASCADE)
- Articles can have 0-10 tags (enforced at application level)

---

### 6. Comment

Represents a guest comment on an article.

**Table**: `comments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique comment identifier |
| `article_id` | UUID | NOT NULL, FOREIGN KEY → articles(id) ON DELETE CASCADE | Article reference |
| `nickname` | VARCHAR(50) | NOT NULL | Commenter nickname |
| `content` | TEXT | NOT NULL | Comment text |
| `ip_address` | VARCHAR(45) | NULL | Commenter IP address (for rate limiting) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Comment timestamp |

**Indexes**:
- Primary key on `id`
- Index on `article_id` (for article comment lookup)
- Index on `created_at DESC` (for sorting)
- Index on `ip_address, created_at` (for rate limiting queries)

**Validation Rules**:
- Nickname: 2-50 characters, required, may contain spaces
- Content: 1-1000 characters, required
- IP address: IPv4 or IPv6 format (stored for rate limiting, not displayed)

**Relationships**:
- Many-to-one with `Article`

**Notes**:
- No user authentication required (guest comments)
- `ip_address` used for rate limiting (max 3 comments/hour per IP)
- Deleting article cascades to comments
- No comment editing (guest comments are immutable)
- Admin can delete comments via admin interface

---

## Database Schema (PostgreSQL DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    search_vector TSVECTOR
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Article-Tags join table
CREATE TABLE article_tags (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (article_id, tag_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 1000),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_search_vector ON articles USING GIN(search_vector);

CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);

CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_rate_limit ON comments(ip_address, created_at);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Full-text search trigger
CREATE TRIGGER articles_search_vector_update
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

---

## Data Validation Summary

| Entity | Field | Validation Rule |
|--------|-------|----------------|
| **Admin** | username | 3-50 chars, alphanumeric + underscore |
| | password | Min 12 chars (before hashing) |
| | email | Valid RFC 5322 email |
| **Article** | title | 1-255 chars |
| | slug | Lowercase, alphanumeric + hyphens, unique |
| | summary | 0-500 chars |
| | content | 1-100,000 chars |
| | status | Enum: 'draft' or 'published' |
| | view_count | Non-negative integer |
| **Category** | name | 1-100 chars, unique |
| | slug | Lowercase, alphanumeric + hyphens, unique |
| | description | 0-500 chars |
| **Tag** | name | 1-50 chars, unique, case-insensitive |
| | slug | Lowercase, alphanumeric + hyphens, unique |
| **Comment** | nickname | 2-50 chars |
| | content | 1-1000 chars |
| | ip_address | IPv4/IPv6 format |

---

## Migration Strategy

1. **Initial Migration** (`001_create_schema.sql`):
   - Create all tables, indexes, triggers
   - Seed admin account (username: admin, password: changeme)
   - Seed sample categories (DevOps, Backend, Personal)

2. **Future Migrations**:
   - `002_add_article_series.sql` - Add article series feature
   - `003_add_scheduled_publishing.sql` - Add scheduled_at column
   - `004_add_article_metadata.sql` - Add JSONB metadata column

3. **Migration Tools**:
   - Use `goose` for migration management
   - Migrations stored in `backend/internal/db/migrations/`
   - All migrations must have `up` and `down` scripts

---

## Sample Data

### Admin Seed Data
```sql
INSERT INTO admins (username, password_hash, email)
VALUES (
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYXqK0M5V0q', -- bcrypt('changeme')
    'admin@myblogspot.local'
);
```

### Category Seed Data
```sql
INSERT INTO categories (name, slug, description) VALUES
    ('DevOps', 'devops', 'DevOps practices, tools, and infrastructure automation'),
    ('Backend Engineering', 'backend-engineering', 'Backend development, APIs, and system design'),
    ('Infrastructure', 'infrastructure', 'Infrastructure experiments, cloud platforms, and architecture'),
    ('Personal', 'personal', 'Personal stories, experiences, and reflections');
```

### Tag Seed Data
```sql
INSERT INTO tags (name, slug) VALUES
    ('Go', 'go'),
    ('PostgreSQL', 'postgresql'),
    ('Docker', 'docker'),
    ('Kubernetes', 'kubernetes'),
    ('AWS', 'aws'),
    ('Next.js', 'nextjs'),
    ('API Design', 'api-design'),
    ('Performance', 'performance');
```

---

## Notes

- All timestamps stored in UTC
- UUID v4 used for primary keys (better for distributed systems)
- PostgreSQL 15+ required for native UUID generation (`gen_random_uuid()`)
- Full-text search uses English dictionary (`pg_catalog.english`)
- IP addresses stored as VARCHAR(45) to support both IPv4 and IPv6
- Cascading deletes ensure referential integrity
- All text fields use TEXT type (no length limit at DB level, validated at application level)
- `view_count` uses CHECK constraint to prevent negative values
- Article status uses CHECK constraint to enforce enum values
