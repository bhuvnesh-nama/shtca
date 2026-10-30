# ==========================================
# STAGE 1: Build TypeScript Application
# ==========================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native dependencies required by node-canvas and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ==========================================
# STAGE 2: Minimal Production Runtime
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install runtime libraries for canvas and curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    curl \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8000

# Copy built application, templates, and production dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/templates ./src/templates

# Ensure public and upload directories exist for multipart citizen evidence storage
RUN mkdir -p /app/public/uploads

EXPOSE 8000

# Container healthcheck ensuring API is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["node", "dist/index.js"]
