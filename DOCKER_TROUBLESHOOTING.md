# Docker Troubleshooting

## Known Issues

### npm install in Alpine container

There's a known issue with npm in Alpine Linux containers where `npm ci` or `npm install` sometimes fails with:

```
npm error Exit handler never called!
npm error This is an error with npm itself.
```

This appears to be a transient issue with npm in certain environments.

### Workarounds

1. **Use the node:20 (debian-based) image instead of node:20-alpine**:
   ```dockerfile
   FROM node:20
   ```

2. **Run docker-compose which mounts node_modules as a volume** (better for development):
   ```bash
   docker-compose up
   ```

3. **Build locally and copy node_modules**:
   ```bash
   npm install
   docker build -t tokioai-backend .
   ```

4. **Try the build multiple times** - sometimes the issue is transient

### Testing Dockerfile Changes

If you modify the Dockerfile:

```bash
# Build
docker build -t tokioai-backend:test -f docker/Dockerfile .

# Test
docker run --rm -p 8080:8080 tokioai-backend:test

# Or use docker-compose
docker-compose up --build
```

## Alternative: Use Debian-based Image

Replace the first line in `docker/Dockerfile`:

```dockerfile
FROM node:20
# instead of: FROM node:20-alpine
```

This will create a larger image but is more reliable with npm.
