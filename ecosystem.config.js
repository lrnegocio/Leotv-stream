module.exports = {
  apps : [{
    name: "leotv-master",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000",
    cwd: "/root/leotv",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    instances: 1, 
    exec_mode: "fork",
    max_memory_restart: "400M",
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
