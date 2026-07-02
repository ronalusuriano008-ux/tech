// =====================================================
// PM2 ECOSYSTEM CONFIGURATION
// =====================================================
// Uso: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'taller-tech',
      script: './backend/server.js',
      
      // Clustering
      instances: 'max',
      exec_mode: 'cluster',
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logs
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      max_memory_restart: '500M',
      
      // Delays
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // File watching
      watch: false,
      ignore_watch: ['node_modules', 'backend/data', 'backend/temp', 'backend/public'],
      
      // Process management
      interpreter: 'node',
      interpreter_args: '',
      
      // Additional
      cron_restart: '0 0 * * *', // Daily restart at midnight
    }
  ],

  // Deploy configuration
  deploy: {
    production: {
      user: 'usuario',
      host: 'tu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/taller-tech.git',
      path: '/home/usuario/taller-tech',
      'post-deploy': 'npm install --only=production && pm2 restart ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production server"'
    }
  }
};
