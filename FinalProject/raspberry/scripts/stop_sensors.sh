#!/bin/bash
PID=$(pgrep -f '/home/simonll4/python/.venv/bin/python /home/simonll4/python/main.py')
if [ -n "$PID" ]; then
    kill -SIGTERM $PID
    sleep 1
    # Verificar si el proceso sigue corriendo
    if ps -p $PID >/dev/null; then
        kill -SIGKILL $PID
    fi
fi

##pkill -f '/home/simonll4/python/.venv/bin/python /home/simonll4/python/main.py'
