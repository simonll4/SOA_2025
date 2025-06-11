#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import os
import signal
import sys

# Configuración
RELAY_PIN = 21  # IN2 del módulo relé
PID_FILE = "/tmp/relay_channel_21.pid"


def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(RELAY_PIN, GPIO.OUT)
    GPIO.output(RELAY_PIN, GPIO.HIGH)  # Estado inicial: apagado (activo en bajo)


def relay_on(): 
    GPIO.output(RELAY_PIN, GPIO.LOW)
    print("Relé en GPIO 21 ACTIVADO (LOW)")


def relay_off():
    GPIO.output(RELAY_PIN, GPIO.HIGH)
    print("Relé en GPIO 21 DESACTIVADO (HIGH)")
    GPIO.cleanup()


def write_pid():
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))


def cleanup(signum=None, frame=None):
    if os.path.exists(PID_FILE):
        os.remove(PID_FILE)
    relay_off()
    sys.exit(0)


# Señales de apagado limpio
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

if __name__ == "__main__":
    if os.path.exists(PID_FILE):
        print(
            "Ya hay un proceso para GPIO 21. Usa kill -TERM $(cat /tmp/relay_channel_21.pid)"
        )
        sys.exit(1)

    try:
        setup_gpio()
        relay_on()
        write_pid()
        while True:
            time.sleep(1)
    except Exception as e:
        print(f"Error: {e}")
        cleanup()

#kill -TERM $(cat /tmp/relay_channel_20.pid)
#kill -TERM $(cat /tmp/relay_channel_21.pid)
