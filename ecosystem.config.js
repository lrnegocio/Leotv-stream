
module.exports = {
  apps : [{
    name: "leotv-master",
    script: "npm",
    args: "start -- -p 80",
    env: {
      NODE_ENV: "production",
      PORT: 80
    },
    // Otimizado para 1GB de RAM (AlmaLinux 9)
    instances: 1, 
    exec_mode: "fork",
    max_memory_restart: "400M", // Reinicia se passar de 400MB para evitar travamento total da VPS
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
