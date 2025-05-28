#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import os
import signal
import sys

# Configuración
channel = 21
pid_file = "/tmp/motor_control.pid"


def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(channel, GPIO.OUT)
    GPIO.output(channel, GPIO.LOW)


def motor_on():
    GPIO.output(channel, GPIO.HIGH)


def motor_off():
    GPIO.output(channel, GPIO.LOW)
    GPIO.cleanup()


def write_pid():
    with open(pid_file, "w") as f:
        f.write(str(os.getpid()))


def cleanup(signum=None, frame=None):
    """Limpieza al recibir señal o terminar"""
    if os.path.exists(pid_file):
        os.remove(pid_file)
    motor_off()
    sys.exit(0)


# Registrar manejadores de señales
signal.signal(signal.SIGTERM, cleanup)
signal.signal(signal.SIGINT, cleanup)

if __name__ == "__main__":
    # Verificar si ya está en ejecución
    if os.path.exists(pid_file):
        print(
            "El proceso ya está en ejecución. Usa 'kill -TERM $(cat /tmp/motor_control.pid)' para detenerlo."
        )
        sys.exit(1)

    try:
        setup_gpio()
        motor_on()
        write_pid()

        # Mantener el proceso activo
        while True:
            time.sleep(1)

    except Exception as e:
        print(f"Error: {str(e)}")
        cleanup()
