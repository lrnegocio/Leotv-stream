
module.exports = {
  apps : [{
    name: "leotv-master",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "1G",
    autorestart: true,
    watch: false
  }]
}
