module.exports = {
  apps: [
    {
      name:      'ecove',
      script:    '.next/standalone/server.js',
      cwd:       '/var/www/ecove',

      // 1 core VPS: single instance in fork mode
      // fork mode uses ~30% less memory than cluster on single core
      // Change to instances: 2, exec_mode: 'cluster' when you upgrade to 2+ cores
      instances:  1,
      exec_mode:  'fork',

      // Memory limit — restart before OOM killer hits
      // 2GB RAM server: keep under 600MB so OS + PostgreSQL + Redis have headroom
      max_memory_restart: '400M',

      // Environment
      env_production: {
        NODE_ENV:    'production',
        PORT:        3000,
        HOSTNAME:    '0.0.0.0',
        ENABLE_JOBS: 'true',
      },

      // Log files
      error_file:      '/var/log/ecove/error.log',
      out_file:        '/var/log/ecove/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs:      true,

      // Crash recovery
      autorestart:   true,
      restart_delay: 3000,   // wait 3s before restarting (was 1s — too aggressive)
      max_restarts:  10,
      min_uptime:    '10s',

      // Graceful shutdown
      kill_timeout: 5000,
      // REMOVED: wait_ready — Next.js standalone never sends process.send('ready')
      //          so PM2 waits forever then force-kills. Remove it entirely.

      // Watch disabled in production
      watch: false,
    },
  ],
}
