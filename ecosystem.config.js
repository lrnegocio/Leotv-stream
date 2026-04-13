
module.exports = {
  apps : [{
    name: "leotv-master",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // MODO CLUSTER: Usa todos os núcleos do processador da VPS para máxima velocidade
    instances: "max", 
    exec_mode: "cluster",
    max_memory_restart: "1G",
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
