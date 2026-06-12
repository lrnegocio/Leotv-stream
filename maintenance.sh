#!/bin/bash

echo "🛠️ PROTOCOLO DE MANUTENÇÃO VPS - LÉO TV v385-S"
echo "--------------------------------------------------"

case "$1" in
    stop-radio)
        echo "🧊 CONGELANDO TRANSMISSÃO DA RÁDIO (FFMPEG)..."
        pkill -9 ffmpeg 2>/dev/null || true
        echo "✅ CPU LIBERADA. O programa rádio continua instalado, mas não está rodando."
        ;;
    start-radio)
        echo "📻 REINICIANDO TRANSMISSÃO DA RÁDIO..."
        echo "⚠️ Mestre, verifique seu comando de rádio original para ligar novamente."
        ;;
    free-ram)
        echo "🧹 LIMPANDO MEMÓRIA RAM DO SISTEMA..."
        sync && echo 3 > /proc/sys/vm/drop_caches
        echo "✅ RAM RECALIBRADA."
        ;;
    *)
        echo "Uso: ./maintenance.sh [stop-radio | start-radio | free-ram]"
        ;;
esac
