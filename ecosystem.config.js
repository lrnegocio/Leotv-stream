
module.exports = {
  apps : [{
    name: "leotv-master",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // Otimizado para 1 Core e 1GB de RAM (Configuração de Entrada)
    instances: 1, 
    exec_mode: "fork",
    max_memory_restart: "450M", // Reinicia se passar de 450MB para garantir que a VPS de 1GB não trave
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
