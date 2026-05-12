# Research: MyBlogSpot Technical Decisions

**Date**: 2026-05-12  
**Feature**: Personal Publishing Platform  
**Purpose**: Document technology choices, architectural decisions, and best practices research

---

## 1. Frontend Framework: Next.js 14 with App Router

### Decision
Use **Next.js 14** with **App Router** (not Pages Router) as the frontend framework.

### Rationale
- **React Server Components (RSC)**: Dramatically improves performance by rendering components on the server, reducing client-side JavaScript bundle size
- **Streaming and Suspense**: Progressive page rendering improves perceived performance
- **File-based Routing**: App Router provides intuitive route organization matching our article/category/tag structure
- **Built-in Optimizations**: Automatic code splitting, image optimization, font optimization
- **SEO-Friendly**: Server-side rendering ensures search engines can index technical content
- **Vercel Deployment**: Seamless deployment with edge functions and global CDN
- **TypeScript Support**: First-class TypeScript integration for type safety
- **Developer Experience**: Fast refresh, built-in linting, excellent documentation

### Alternatives Considered
- **Pages Router**: Older Next.js pattern, less performant, doesn't leverage RSC
- **Create React App**: No SSR/SSG, poor SEO, requires manual optimization
- **Remix**: Excellent framework but less mature ecosystem, harder Vercel deployment
- **Astro**: Great for content sites but overkill for our needs, less React ecosystem support

### Implementation Notes
- Use `app/` directory structure (not `pages/`)
- Leverage Server Components for article rendering
- Use Client Components only where interactivity is needed (comments, search, admin editor)
- Enable experimental features: `serverActions` for form handling

---

## 2. Backend Framework: Go with Chi Router

### Decision
Use **Go 1.22+** with **go-chi/chi** as the HTTP router.

### Rationale
- **Performance**: Go's concurrency model and compiled nature provide excellent performance
- **Simplicity**: Standard library is powerful, minimal external dependencies needed
- **Type Safety**: Strong static typing prevents runtime errors
- **Deployment**: Single binary deployment simplifies operations
- **Resource Efficiency**: Low memory footprint suitable for VPS hosting
- **Chi Router**: Lightweight, idiomatic Go, middleware-friendly, no reflection overhead
- **Standard Library**: Context, HTTP, JSON handling built-in
- **Portfolio Value**: Demonstrates backend engineering skills

### Alternatives Considered
- **Gin**: Faster but uses reflection, non-idiomatic Go patterns
- **Echo**: Similar to Gin, less community adoption
- **Fiber**: Express-like API but abstracts away standard library
- **Standard Library Only**: Too low-level for productivity, reinventing middleware

### Implementation Notes
- Use chi for routing and middleware chaining
- Follow standard Go project layout (`cmd/`, `internal/`, `pkg/`)
- Use context for request-scoped values (user ID, request ID)
- Structured logging with JSON output for production

---

## 3. Database: PostgreSQL 15+ with sqlc

### Decision
Use **PostgreSQL 15+** as the primary database with **sqlc** for type-safe query generation.

### Rationale
- **PostgreSQL Strengths**: 
  - Full-text search (built-in for article search)
  - JSONB for flexible metadata storage
  - Excellent indexing (GIN, GiST for search)
  - ACID compliance for data integrity
  - Proven reliability and performance
- **sqlc Benefits**:
  - Compile-time type safety (catches errors before runtime)
  - No ORM overhead or N+1 query problems
  - Write SQL directly (full control, easier optimization)
  - Constitution requirement (type-safe queries)
  - Generates idiomatic Go code

### Alternatives Considered
- **MySQL**: Less powerful full-text search, weaker JSON support
- **SQLite**: Not suitable for concurrent writes (production traffic)
- **GORM (ORM)**: Abstraction overhead, hidden N+1 queries, constitution violation
- **Raw SQL**: Error-prone, no compile-time validation, violates constitution

### Implementation Notes
- Use `goose` for database migrations (up/down migrations)
- Write `.sql` files in `internal/db/queries/`
- Run `sqlc generate` to create type-safe Go functions
- Use PostgreSQL's `GENERATED` columns for slug generation
- Enable full-text search with `tsvector` columns and GIN indexes

---

## 4. Authentication: JWT with HTTP-Only Cookies

### Decision
Use **JWT tokens** stored in **HTTP-only cookies** for admin authentication.

### Rationale
- **JWT Benefits**: Stateless, no server-side session storage, horizontal scaling friendly
- **HTTP-Only Cookies**: XSS protection (JavaScript can't access tokens)
- **Secure Flag**: HTTPS-only transmission prevents MITM attacks
- **SameSite=Strict**: CSRF protection
- **Simplicity**: No session store (Redis) needed for solo admin use case
- **Token Expiry**: Short-lived tokens (1 hour) with refresh mechanism

### Alternatives Considered
- **Session-based Auth**: Requires session store (Redis), state management overhead
- **OAuth2/OpenID**: Overkill for single admin, external dependency
- **Local Storage JWT**: Vulnerable to XSS attacks
- **Basic Auth**: Not suitable for web applications, no logout mechanism

### Implementation Notes
- Sign JWTs with HS256 (symmetric key from environment variable)
- Include claims: `admin_id`, `exp` (expiration), `iat` (issued at)
- Middleware validates JWT on protected routes (`/api/v1/admin/*`)
- Frontend sends cookies automatically with API requests
- Implement token refresh endpoint for extended sessions

---

## 5. Content Authoring: Markdown with MDX Support

### Decision
Support **Markdown** for article content with optional **MDX** for advanced use cases.

### Rationale
- **Markdown Simplicity**: Easy to write, read, and version control
- **MDX Flexibility**: Embed React components for interactive demos
- **Code Highlighting**: Prism.js/Shiki for syntax highlighting
- **Portable**: Content is not locked into proprietary formats
- **Git-Friendly**: Plain text enables version control and diffs
- **Developer Audience**: Technical writers prefer markdown

### Alternatives Considered
- **Rich Text Editor (WYSIWYG)**: Content stored in HTML, less portable, harder to version
- **Notion/Contentful (Headless CMS)**: External dependency, vendor lock-in, cost
- **HTML Only**: Too verbose, error-prone, no structure

### Implementation Notes
- Frontend uses `next-mdx-remote` for rendering
- Backend stores raw markdown in PostgreSQL `TEXT` column
- Support GitHub Flavored Markdown (GFM) syntax
- Code blocks support language-specific syntax highlighting
- Frontmatter for metadata (title, tags, published date)

---

## 6. Styling: Tailwind CSS with Typography Plugin

### Decision
Use **Tailwind CSS 3.x** with **@tailwindcss/typography** plugin.

### Rationale
- **Utility-First**: Rapid UI development without context switching
- **Consistency**: Design tokens ensure consistent spacing, colors, typography
- **Performance**: PurgeCSS removes unused styles (small bundle size)
- **Typography Plugin**: Beautiful default styles for markdown content
- **Dark Mode**: Built-in dark mode support with `class` strategy
- **Responsive**: Mobile-first breakpoint system
- **Developer Experience**: IntelliSense, no CSS naming conflicts

### Alternatives Considered
- **CSS Modules**: More verbose, slower development
- **Styled Components**: Runtime overhead, larger bundle size
- **Material-UI/Chakra**: Component libraries add unnecessary complexity
- **Vanilla CSS**: No design system, inconsistent spacing/colors

### Implementation Notes
- Configure Tailwind in `tailwind.config.js`
- Use Typography plugin (`prose` class) for article content
- Define custom colors for brand identity
- Use `clsx` utility for conditional classes
- Extract common patterns as Tailwind components in `@layer components`

---

## 7. Search Implementation: PostgreSQL Full-Text Search

### Decision
Use **PostgreSQL's built-in full-text search** (FTS) with `tsvector` and GIN indexes.

### Rationale
- **No External Dependency**: Reduces complexity (no Elasticsearch, Algolia)
- **Cost-Effective**: No additional service costs
- **Performance**: GIN indexes provide fast search (< 1 second for 1000+ articles)
- **Relevance Ranking**: `ts_rank` function ranks results by relevance
- **Simplicity**: SQL queries instead of learning new search DSL
- **Solo Developer Friendly**: One less service to maintain

### Alternatives Considered
- **Elasticsearch**: Overkill for < 1000 articles, operational overhead
- **Algolia**: Excellent but paid service, vendor lock-in
- **Simple LIKE Queries**: Slow, no ranking, no stemming
- **Full External Search Service**: Increases complexity unnecessarily

### Implementation Notes
- Add `search_vector` column (type `tsvector`) to `articles` table
- Create GIN index: `CREATE INDEX articles_search_idx ON articles USING GIN(search_vector)`
- Update `search_vector` on article insert/update using triggers or application logic
- Use `ts_query` for search queries with ranking: `SELECT * FROM articles WHERE search_vector @@ to_tsquery('search terms') ORDER BY ts_rank(search_vector, to_tsquery('search terms')) DESC`
- Support multi-word search and phrase queries

---

## 8. Rate Limiting: Token Bucket with In-Memory Store

### Decision
Use **token bucket algorithm** with **in-memory storage** (sync.Map) for rate limiting.

### Rationale
- **Simplicity**: No external service (Redis) needed
- **Effectiveness**: Prevents brute force attacks on admin login
- **Performance**: In-memory lookup is fast
- **Sufficient**: Single backend instance can handle rate limit state
- **Constitution Compliance**: Rate limiting required on auth endpoints

### Alternatives Considered
- **Redis-backed**: Overkill for single admin use case
- **External Service**: Adds operational complexity
- **No Rate Limiting**: Violates constitution, security risk

### Implementation Notes
- Use `golang.org/x/time/rate` package (standard library extension)
- Apply rate limiter middleware to `/api/v1/admin/login` (5 attempts per 15 minutes per IP)
- Apply global rate limiter to public APIs (100 requests per minute per IP)
- Return `429 Too Many Requests` when limit exceeded
- Future: Consider Redis for multi-instance deployments

---

## 9. Comment System: Guest Comments with Nickname

### Decision
Allow **anonymous guest comments** with **nickname-only** (no email, no registration).

### Rationale
- **Low Friction**: Encourages engagement without authentication barriers
- **Privacy-Friendly**: No email collection, GDPR-friendly
- **Simplicity**: No user account management needed
- **Spam Mitigation**: Admin moderation + rate limiting prevents abuse
- **Spec Requirement**: Aligns with user story requirements

### Alternatives Considered
- **Required Email**: Adds friction, reduces engagement
- **OAuth/Social Login**: Overkill for comment system
- **No Comments**: Reduces engagement, no community interaction

### Implementation Notes
- Comments table: `id`, `article_id`, `nickname`, `content`, `created_at`
- Input validation: Nickname 2-50 chars, content 1-500 chars
- Rate limiting: Max 3 comments per IP per hour
- Admin moderation: Delete inappropriate comments via admin interface
- Future: Add simple spam detection (keyword filter, duplicate detection)

---

## 10. Testing Strategy: Real Database + E2E Tests

### Decision
Use **real PostgreSQL database** for integration tests with **testcontainers** pattern.

### Rationale
- **Constitution Requirement**: Integration tests must use real database
- **Confidence**: Tests validate actual database behavior (migrations, queries, constraints)
- **Catch Issues Early**: Detects migration problems before production
- **Testcontainers**: Spins up temporary PostgreSQL container per test suite
- **Isolation**: Each test suite gets clean database state
- **CI-Friendly**: Works in CI/CD environments (GitHub Actions, GitLab CI)

### Alternatives Considered
- **Mock Database**: Violates constitution, doesn't test real SQL
- **Shared Test DB**: State pollution between tests
- **SQLite for Tests**: Behavior differences from PostgreSQL

### Implementation Notes
- Use `testcontainers-go` package for PostgreSQL container lifecycle
- Run migrations before each test suite
- Frontend: Jest for component tests, Playwright for E2E tests
- Backend: Go standard testing package, testify for assertions
- Target: ≥80% coverage for backend, ≥70% for frontend

---

## 11. Deployment Strategy

### Decision
- **Frontend**: Deploy on **Vercel** (automatic from GitHub)
- **Backend**: Deploy as **Docker container** on VPS/cloud platform
- **Database**: Managed PostgreSQL (DigitalOcean, AWS RDS, or Supabase)

### Rationale
- **Vercel for Frontend**: 
  - Zero-config Next.js deployment
  - Global CDN (edge functions)
  - Automatic HTTPS
  - Preview deployments for PRs
  - Free tier sufficient
- **Docker for Backend**: 
  - Consistent environment (dev/prod parity)
  - Easy deployment to any platform
  - Resource efficient
  - Portable (VPS, AWS ECS, GCP Cloud Run)
- **Managed Database**: 
  - Automated backups
  - High availability
  - Monitoring included
  - SSL/TLS encryption

### Alternatives Considered
- **Monolithic Deployment**: Limits flexibility, harder scaling
- **Serverless Backend**: Cold starts, complexity for this use case
- **Self-managed Database**: Operational overhead for solo developer

### Implementation Notes
- Create `Dockerfile` for Go backend (multi-stage build)
- Create `docker-compose.yml` for local development
- Environment variables for configuration (`.env` files)
- GitHub Actions for CI/CD:
  - Run tests on pull requests
  - Build and push Docker image on merge to main
  - Auto-deploy to production
- Database migrations run automatically on backend startup

---

## 12. Monitoring and Observability (Future Enhancement)

### Decision (Future)
Add **structured logging** and **basic metrics** in initial version. Full observability stack (Prometheus, Grafana) deferred to post-launch.

### Rationale
- **Start Simple**: JSON structured logging sufficient for initial launch
- **Add When Needed**: Observability tooling added when traffic warrants
- **Solo Developer**: Focus on core features first
- **Easy Addition**: Architecture supports adding monitoring later

### Initial Implementation
- Backend: JSON structured logging (log level, request ID, duration, error context)
- Frontend: Vercel Analytics (built-in)
- Database: Connection pool metrics in logs

### Future Enhancements
- Prometheus metrics export (`/metrics` endpoint)
- Grafana dashboards (request rate, latency, error rate)
- Sentry for error tracking
- Distributed tracing (OpenTelemetry)

---

## Summary of Key Technologies

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) | RSC performance, SEO, Vercel deployment |
| **Styling** | Tailwind CSS + Typography | Rapid development, beautiful prose |
| **Content** | Markdown/MDX | Simple, portable, developer-friendly |
| **Backend** | Go 1.22 + Chi Router | Performance, simplicity, single binary |
| **Database** | PostgreSQL 15 + sqlc | Full-text search, type safety, ACID |
| **Auth** | JWT (HTTP-only cookies) | Stateless, secure, XSS/CSRF protection |
| **Search** | PostgreSQL FTS | No external dependency, cost-effective |
| **Rate Limiting** | Token bucket (in-memory) | Simple, effective, sufficient for scale |
| **Testing** | Jest, Playwright, Go test | Real DB tests, E2E coverage |
| **Deployment** | Vercel + Docker + Managed DB | Simple, scalable, maintainable |

---

## Architecture Diagrams

### System Architecture
```
┌─────────────┐
│   Visitor   │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────┐
│  Vercel CDN (Frontend)  │
│    Next.js 14 App       │
│  - Server Components    │
│  - Static Generation    │
│  - API Routes (proxy)   │
└───────────┬─────────────┘
            │
            │ REST API
            ▼
┌─────────────────────────┐
│   Backend API (Go)      │
│  - Chi Router           │
│  - JWT Auth Middleware  │
│  - Rate Limiter         │
│  - CORS Middleware      │
└───────────┬─────────────┘
            │
            │ SQL
            ▼
┌─────────────────────────┐
│   PostgreSQL 15+        │
│  - Full-text Search     │
│  - JSONB Metadata       │
│  - GIN Indexes          │
└─────────────────────────┘
```

### Data Flow: Public Article Read
```
User Request → Vercel CDN → Next.js SSR → Backend API → PostgreSQL
                   ↓
            Cached Response (Edge)
                   ↓
                 User
```

### Data Flow: Admin Article Publish
```
Admin → Next.js Admin UI → JWT Auth → Backend API → PostgreSQL
                                          ↓
                                    Invalidate Cache
                                          ↓
                                  Public Site Updated
```

---

## Development Workflow

1. **Local Development**:
   - `docker-compose up` (PostgreSQL + pgAdmin)
   - `cd backend && go run cmd/server/main.go` (Backend on :8080)
   - `cd frontend && npm run dev` (Frontend on :3000)

2. **Database Changes**:
   - Write migration: `goose create add_table sql`
   - Apply migration: `goose up`
   - Update queries: Edit `.sql` files in `internal/db/queries/`
   - Regenerate code: `sqlc generate`

3. **Testing**:
   - Backend: `go test ./...` (unit + integration)
   - Frontend: `npm test` (Jest), `npm run test:e2e` (Playwright)
   - Coverage: `go test -cover ./...`, `npm run test:coverage`

4. **Deployment**:
   - Push to `main` branch → GitHub Actions CI/CD
   - Frontend auto-deploys to Vercel
   - Backend Docker image built and pushed
   - Manual deploy to production server (or automated with scripts)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Search performance degrades with >1000 articles | Medium | Medium | PostgreSQL FTS scales to 10k+ articles with proper indexing; can migrate to Elasticsearch if needed |
| Single backend instance becomes bottleneck | Low | Medium | Backend is stateless; horizontal scaling straightforward |
| Comment spam overwhelms moderation | Medium | Low | Rate limiting + admin moderation; can add spam detection later |
| JWT secret compromise | Low | High | Rotate secrets periodically; use strong random secrets; monitor for suspicious activity |
| Database migration failures | Low | High | Write reversible migrations; test in staging; backup before production migrations |

---

## Next Steps

Phase 1 tasks:
1. Create `data-model.md` with detailed entity schemas
2. Define API contracts in `contracts/` directory
3. Create `quickstart.md` for developer onboarding
4. Update `CLAUDE.md` with plan reference

After planning, proceed to `/speckit-tasks` for detailed implementation task breakdown.
