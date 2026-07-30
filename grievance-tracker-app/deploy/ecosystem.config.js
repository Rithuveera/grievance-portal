module.exports = {
  apps: [
    {
      name: "grievance-tracker-backend",
      cwd: "./backend",
      script: "server.js",
      env: {
        NODE_ENV: "production"
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    }
  ]
};
