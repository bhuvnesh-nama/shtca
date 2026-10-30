# ==========================================
# STAGE 1: Build Vite React Production Bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time Vite arguments
ARG VITE_API_BASE_URL=""
ARG VITE_MAP_PROVIDER="osm"
ARG VITE_MAP_TILES_URL="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
ARG VITE_CARTO_API_KEY=""
ARG VITE_MAPTILER_API_KEY=""

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MAP_PROVIDER=$VITE_MAP_PROVIDER
ENV VITE_MAP_TILES_URL=$VITE_MAP_TILES_URL
ENV VITE_CARTO_API_KEY=$VITE_CARTO_API_KEY
ENV VITE_MAPTILER_API_KEY=$VITE_MAPTILER_API_KEY

RUN npm run build

# ==========================================
# STAGE 2: Caddy Web Server with Automatic TLS
# ==========================================
FROM caddy:2-alpine

# Copy built frontend assets
COPY --from=builder /app/dist /var/www/html

# Copy default Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

