#!/bin/bash
set -e

# =================================================================
# Production Deployment Script for shtca.com
# =================================================================

echo "======================================================"
echo "🚀 Deploying SHTCA Production Stack"
echo "🌐 Domains: shtca.com & api.shtca.com"
echo "======================================================"

# 1. Check if docker and docker compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. Check if .env.production exists
if [ ! -f .env.production ] && [ ! -f .env ]; then
    echo "⚠️  No .env.production found. Creating from .env.production.example..."
    cp .env.production.example .env.production
    echo "👉 Please edit .env.production with your secrets (JWT_SECRET, Passwords, etc.):"
    echo "   nano .env.production"
    exit 1
fi

# 3. Pull latest code (if in git repository)
if [ -d .git ]; then
    echo "📥 Pulling latest git updates..."
    git pull origin main || true
fi

# 4. Spin up Docker containers
echo "🐳 Building and starting production containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# 5. Prune dangling images to free up VPS disk space
echo "🧹 Cleaning up unused Docker build cache..."
docker image prune -f

echo "======================================================"
echo "✅ All containers are running!"
echo "🌐 Web App:     https://shtca.com"
echo "🔌 API Gateway: https://api.shtca.com"
echo "📊 Check status: docker compose -f docker-compose.prod.yml ps"
echo "📜 View logs:   docker compose -f docker-compose.prod.yml logs -f"
echo "======================================================"

