module.exports = {
  apps : [{
    name: "leotv-master",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 80",
    cwd: "/root/leotv",
    env: {
      NODE_ENV: "production",
      PORT: 80
    },
    instances: 1, 
    exec_mode: "fork",
    max_memory_restart: "400M",
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
