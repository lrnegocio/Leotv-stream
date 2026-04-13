
module.exports = {
  apps : [{
    name: "leotv-master",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // Otimizado para 1 Core e 2GB de RAM
    instances: 1, 
    exec_mode: "fork",
    max_memory_restart: "600M", // Reinicia se passar de 600MB para não travar a VPS
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
