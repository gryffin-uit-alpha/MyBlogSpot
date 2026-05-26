# Gitea Workflows Setup

## Dependency Track Integration

Workflow generates SBOMs for backend (Go) and frontend (Node.js), uploads to Dependency-Track, checks for critical vulnerabilities.

### Required Secrets

Configure in Gitea repository settings → Secrets:

1. **DEPENDENCY_TRACK_URL** - Full URL to Dependency-Track instance (e.g., `https://dtrack.example.com`)
2. **DEPENDENCY_TRACK_API_KEY** - API key from Dependency-Track (Settings → Access Management → Teams → Create API Key)

### How to Set Secrets

```bash
# Via Gitea UI:
# Repository → Settings → Secrets → Add Secret

# Or via API:
curl -X POST "https://gitea.example.com/api/v1/repos/OWNER/REPO/secrets" \
  -H "Authorization: token YOUR_GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DEPENDENCY_TRACK_URL",
    "data": "https://dtrack.example.com"
  }'
```

### Workflow Behavior

- **Trigger**: Push to main, PRs to main, manual dispatch
- **Backend Job**: Generates CycloneDX SBOM from go.mod using cyclonedx-gomod
- **Frontend Job**: Generates CycloneDX SBOM from package.json using cyclonedx-npm
- **Vulnerability Check**: Queries Dependency-Track API, fails build if critical vulns found

### Testing

```bash
# Manual trigger via Gitea UI:
# Repository → Actions → dependency-track.yml → Run workflow

# Or push to main:
git commit --allow-empty -m "test: trigger dependency track workflow"
git push origin main
```

### Dependency-Track Setup

1. Create API key in Dependency-Track
2. Projects auto-created on first SBOM upload (autoCreate=true)
3. View results: Dependency-Track → Projects → MyBlogSpot-Backend / MyBlogSpot-Frontend

### Customization

- Change vulnerability threshold: Edit `check-vulnerabilities` job, modify `HIGH` check
- Add email notifications: Add step with SMTP action
- Generate different SBOM formats: Change cyclonedx flags (XML, JSON)
- Separate project versions: Modify `projectVersion` to use git tags instead of branch name
