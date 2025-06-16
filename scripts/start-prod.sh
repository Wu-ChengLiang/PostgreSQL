#!/bin/bash

# Start script for production
echo "🚀 Starting Mingyi Platform in production mode..."

# Check environment
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with production configuration"
    exit 1
fi

# Check database
if [ ! -f mingyi.db ]; then
    echo "❌ Error: Database not found!"
    echo "Please ensure database is properly initialized"
    exit 1
fi

# Install production dependencies only
echo "📦 Installing production dependencies..."
npm ci --production

# Optimize database
echo "⚡ Optimizing database..."
npm run db:optimize

# Start with PM2 in production mode
echo "🏭 Starting application in production mode..."
npm run start:prod

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
npx pm2 save

# Setup PM2 startup script
echo "🔄 Setting up PM2 startup script..."
npx pm2 startup

echo "✅ Production deployment complete!"
echo "📊 View monitoring: npm run monitor"
echo "📋 View logs: npm run logs"