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

---

## Additional Troubleshooting (continued)

### 1) Alpine: missing build tools / node-gyp errors
If native modules need to compile (node-gyp) you'll need typical build deps in Alpine:

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
    && npm ci --production \
    && apk del python3 make g++
```

Common packages to add for more complex native deps:
- build-base (metapackage for make/gcc)
- python3
- gcompat or libc6-compat (for compatibility)
- linux-headers (rarely)

If builds still fail, consider using a Debian-slim base which often avoids these issues:
```dockerfile
FROM node:20-bullseye-slim
```

### 2) Permissions issues (EACCES) when mounting volumes
If `node_modules` is created inside the container but you mount the host folder over it, files may be inaccessible. Recommended patterns:

- Use an anonymous volume for node_modules so the container's node_modules persist:
```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
```

- Or set ownership in the Dockerfile:
```dockerfile
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
USER node
RUN npm ci
```

### 3) Overwriting container node_modules from host
During development, avoid mounting over container-installed `node_modules`. Use the anonymous volume pattern above or mount only specific folders.

### 4) npm cache / transient network problems
If installs fail due to registry or network glitches:
- Clear or verify npm cache:
  ```bash
  npm cache verify
  # or
  npm cache clean --force
  ```
- Increase npm network timeout:
  ```bash
  npm --network-timeout 100000 ci
  ```
- Force a registry:
  ```bash
  npm config set registry https://registry.npmjs.org/
  ```

### 5) Build caching and reproducibility
- To avoid stale caches when changing package files, use `--no-cache`:
  ```bash
  docker build --no-cache -t tokioai-backend:test .
  ```
- To see full build logs:
  ```bash
  docker build --progress=plain .
  ```

### 6) Cleaning Docker when things break
If Docker state is inconsistent:
```bash
docker system prune -a --volumes
# Careful: this removes images, containers, and volumes not in use.
```

### 7) Logs and debugging
- View container logs:
  ```bash
  docker logs -f <container_id>
  # or with docker-compose
  docker-compose logs -f
  ```
- Run interactive shell inside a running container:
  ```bash
  docker exec -it <container_id> sh
  # or for bash-enabled images
  docker exec -it <container_id> bash
  ```
- Run a one-off command:
  ```bash
  docker exec <container_id> npm --version
  ```
- Inspect container details:
  ```bash
  docker inspect <container_id>
  ```

### 8) Alternative package managers (yarn, pnpm)
If npm causes issues, try alternative package managers:

**Yarn:**
```dockerfile
FROM node:20-alpine
RUN npm install -g yarn
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
```

**pnpm:**
```dockerfile
FROM node:20-alpine
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

### 9) Multi-stage build pattern for production
Use multi-stage builds to minimize image size and improve security:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

This pattern:
- Separates build dependencies from runtime
- Reduces final image size
- Improves build caching
- Enhances security by excluding dev tools

### 10) Useful commands summary
Quick reference for common Docker operations:

```bash
# Build and run
docker build -t tokioai-backend .
docker run -p 8080:8080 tokioai-backend

# List and manage containers
docker ps                          # running containers
docker ps -a                       # all containers
docker stop <container_id>
docker rm <container_id>

# List and manage images
docker images
docker rmi <image_id>

# Clean up
docker system prune                # remove unused data
docker system prune -a --volumes   # aggressive cleanup

# Compose operations
docker-compose up                  # start services
docker-compose up -d               # start in background
docker-compose down                # stop and remove
docker-compose logs -f             # follow logs
docker-compose restart             # restart services

# Debugging
docker exec -it <container> sh     # interactive shell
docker logs <container>            # view logs
docker inspect <container>         # detailed info
```
