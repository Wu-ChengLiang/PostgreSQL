#!/bin/bash

# Start script for local development
echo "🚀 Starting Mingyi Platform in development mode..."

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Check if database exists
if [ ! -f mingyi.db ]; then
    echo "🗄️ Database not found. Initializing..."
    npm run db:init
    npm run db:seed
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Optimize database
echo "⚡ Optimizing database..."
npm run db:optimize

# Start with PM2 in development mode
echo "🔧 Starting application with PM2..."
npm run start:dev

# Show logs
echo "📋 Showing logs (press Ctrl+C to exit logs, app will continue running)..."
npm run logs