module.exports = {
  apps: [{
    name: 'mingyi-platform',
    script: './src/app.js',
    instances: process.env.PM2_INSTANCES || 'max',
    exec_mode: process.env.PM2_EXEC_MODE || 'cluster',
    watch: process.env.NODE_ENV === 'development',
    ignore_watch: ['node_modules', 'logs', '*.log', '.git', 'mingyi.db', 'mingyi.db-*'],
    max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    
    // Advanced PM2 features
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000,
    
    // Auto restart
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    
    // CPU and memory optimizations
    node_args: '--max-old-space-size=1024',
    
    // Graceful reload
    wait_ready: true,
    
    // Health check
    cron_restart: '0 0 * * *', // Daily restart at midnight
  }],

  // PM2 deployment configuration
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:username/mingyi-platform.git',
      path: '/var/www/mingyi-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    development: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/develop',
      repo: 'git@github.com:username/mingyi-platform.git',
      path: '/var/www/mingyi-platform-dev',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development'
    }
  }
};