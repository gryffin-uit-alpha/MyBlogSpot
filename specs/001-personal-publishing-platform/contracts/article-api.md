# Article API Contract

**Version**: v1  
**Base Path**: `/api/v1`

---

## Public Endpoints

### List Articles

**Endpoint**: `GET /api/v1/articles`

**Description**: Retrieve a paginated list of published articles.

**Authentication**: None (public)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `per_page` | integer | No | 20 | Items per page (max: 50) |
| `category` | string | No | - | Filter by category slug |
| `tag` | string | No | - | Filter by tag slug |
| `sort` | string | No | `published_at` | Sort field: `published_at`, `view_count`, `title` |
| `order` | string | No | `desc` | Sort order: `asc` or `desc` |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Getting Started with Go",
      "slug": "getting-started-with-go",
      "summary": "A beginner's guide to Go programming language",
      "category": {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "name": "Backend Engineering",
        "slug": "backend-engineering"
      },
      "tags": [
        { "id": "323e4567...", "name": "Go", "slug": "go" },
        { "id": "423e4567...", "name": "Programming", "slug": "programming" }
      ],
      "view_count": 1523,
      "published_at": "2026-05-10T14:30:00Z",
      "created_at": "2026-05-09T10:00:00Z",
      "updated_at": "2026-05-10T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid pagination parameters
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "per_page must be between 1 and 50"
  }
}
```

**Example Requests**:
```bash
# Get first page
GET /api/v1/articles?page=1&per_page=20

# Filter by category
GET /api/v1/articles?category=devops

# Filter by tag
GET /api/v1/articles?tag=go

# Sort by views (most popular first)
GET /api/v1/articles?sort=view_count&order=desc
```

---

### Get Article

**Endpoint**: `GET /api/v1/articles/:slug`

**Description**: Retrieve a single published article by its slug.

**Authentication**: None (public)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Article URL slug |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Getting Started with Go",
    "slug": "getting-started-with-go",
    "summary": "A beginner's guide to Go programming language",
    "content": "# Introduction\n\nGo is a statically typed, compiled programming language...",
    "category": {
      "id": "223e4567-e89b-12d3-a456-426614174000",
      "name": "Backend Engineering",
      "slug": "backend-engineering"
    },
    "tags": [
      { "id": "323e4567...", "name": "Go", "slug": "go" },
      { "id": "423e4567...", "name": "Programming", "slug": "programming" }
    ],
    "view_count": 1523,
    "published_at": "2026-05-10T14:30:00Z",
    "created_at": "2026-05-09T10:00:00Z",
    "updated_at": "2026-05-10T14:30:00Z",
    "comment_count": 12
  }
}
```

**Error Responses**:
- `404 Not Found`: Article not found or not published
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Article not found"
  }
}
```

**Example Request**:
```bash
GET /api/v1/articles/getting-started-with-go
```

**Notes**:
- Returns full `content` field (markdown)
- Includes `comment_count` (computed field)
- Only returns articles with `status = 'published'`
- Draft articles are not accessible via this endpoint

---

### Increment View Count

**Endpoint**: `POST /api/v1/articles/:id/view`

**Description**: Increment the view count for an article (called when article page is viewed).

**Authentication**: None (public)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Article ID |

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "view_count": 1524
  }
}
```

**Error Responses**:
- `404 Not Found`: Article not found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Article not found"
  }
}
```

**Example Request**:
```bash
POST /api/v1/articles/123e4567-e89b-12d3-a456-426614174000/view
```

**Notes**:
- Should be called once per page load
- Idempotent (multiple calls increment once per unique visitor/session)
- Rate limited: 1 increment per article per IP per 15 minutes (prevents view count inflation)

---

## Response Models

### Article (List View)
```typescript
{
  id: string;                 // UUID
  title: string;              // 1-255 characters
  slug: string;               // URL-safe identifier
  summary: string | null;     // 0-500 characters
  category: Category | null;  // Article category
  tags: Tag[];                // Array of tags (0-10 items)
  view_count: number;         // Non-negative integer
  published_at: string;       // ISO 8601 timestamp
  created_at: string;         // ISO 8601 timestamp
  updated_at: string;         // ISO 8601 timestamp
}
```

### Article (Detail View)
```typescript
{
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;            // Full markdown content (1-100,000 characters)
  category: Category | null;
  tags: Tag[];
  view_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  comment_count: number;      // Computed field (count of comments)
}
```

### Category
```typescript
{
  id: string;                 // UUID
  name: string;               // 1-100 characters
  slug: string;               // URL-safe identifier
}
```

### Tag
```typescript
{
  id: string;                 // UUID
  name: string;               // 1-50 characters
  slug: string;               // URL-safe identifier
}
```

---

## Business Rules

1. **Publication Status**: Only articles with `status = 'published'` are accessible via public endpoints
2. **Slug Uniqueness**: Each article has a unique slug for URL routing
3. **View Count**: Incremented once per unique visitor/session per article
4. **Sorting**: Default sort is by `published_at DESC` (newest first)
5. **Pagination**: Default 20 items per page, maximum 50 items per page
6. **Tag Limit**: Articles can have 0-10 tags (enforced at application level)
7. **Content**: Markdown content supports code blocks with syntax highlighting
8. **Summary**: If not provided, can be auto-generated from first 500 characters of content

---

## Validation Rules

### Query Parameters
- `page`: Must be positive integer ≥ 1
- `per_page`: Must be integer between 1 and 50
- `sort`: Must be one of: `published_at`, `view_count`, `title`
- `order`: Must be one of: `asc`, `desc`
- `category`: Must be valid category slug (lowercase, alphanumeric + hyphens)
- `tag`: Must be valid tag slug (lowercase, alphanumeric + hyphens)

### Path Parameters
- `slug`: Must match pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase, alphanumeric, hyphens)
- `id`: Must be valid UUID v4 format

---

## Performance Considerations

1. **Database Indexes**: Queries use indexes on `status`, `published_at`, `category_id`, and `slug`
2. **N+1 Prevention**: Single query with JOINs to fetch category and tags
3. **Full Content**: Detail endpoint returns full markdown content (up to 100KB)
4. **Pagination**: Limit `per_page` to 50 to prevent large response payloads
5. **View Count**: Separate lightweight endpoint to avoid unnecessary full article loads

---

## Security Considerations

1. **No Draft Exposure**: Draft articles (`status = 'draft'`) are never returned by public endpoints
2. **SQL Injection**: All queries use parameterized sqlc-generated code
3. **XSS Prevention**: Content is stored as markdown, not HTML (frontend sanitizes rendering)
4. **View Count Abuse**: Rate limiting prevents artificial inflation
5. **No Admin Exposure**: Admin information never returned in public article responses

---

## Example Integration (Frontend)

```typescript
// Fetch article list
async function getArticles(page: number = 1, category?: string): Promise<ArticleListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: '20'
  });
  
  if (category) {
    params.append('category', category);
  }
  
  const response = await fetch(`/api/v1/articles?${params}`);
  return response.json();
}

// Fetch single article
async function getArticle(slug: string): Promise<ArticleDetailResponse> {
  const response = await fetch(`/api/v1/articles/${slug}`);
  if (!response.ok) {
    throw new Error('Article not found');
  }
  return response.json();
}

// Increment view count
async function trackArticleView(id: string): Promise<void> {
  await fetch(`/api/v1/articles/${id}/view`, { method: 'POST' });
}
```

---

## Related Contracts

- [Admin API](./admin-api.md) - Admin endpoints for article management (create, update, delete)
- [Comment API](./comment-api.md) - Comment endpoints for articles
- [Category & Tag API](./category-tag-api.md) - Category and tag filtering
- [Search API](./search-api.md) - Full-text article search
