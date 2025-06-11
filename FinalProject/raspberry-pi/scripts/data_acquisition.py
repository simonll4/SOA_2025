# /home/simonll4/python/.venv/bin/python /home/simonll4/python/main.py --height {{global.get("container").height}}

import time
import datetime
import json
import numpy as np
import RPi.GPIO as GPIO
from bme280pi import Sensor
import argparse

# Configuración de hardware
bme_sensor = Sensor(address=0x76)
GPIO.setmode(GPIO.BCM)
TRIG, ECHO = 23, 24
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)


# Configura el parser de argumentos
parser = argparse.ArgumentParser()
parser.add_argument(
    "--height", type=float, required=True, help="Altura del recipiente en cm"
)
args = parser.parse_args()



# Parámetros ajustables
NUM_SAMPLES = 10  # Muestras por ciclo
DISTANCIA_MAX = args.height  # Distancia máxima válida (altura del recipiente)  
DISTANCIA_MIN = 2  # Mínima distancia válida (evita ruido eléctrico)


def medir_distancia():
    """Mide distancia con validación de rango."""
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    pulse_start, pulse_end = time.time(), time.time()
    timeout = 0.1  # 100ms para evitar bucles infinitos

    while GPIO.input(ECHO) == 0 and (time.time() - pulse_start) < timeout:
        pulse_start = time.time()

    while GPIO.input(ECHO) == 1 and (time.time() - pulse_start) < timeout:
        pulse_end = time.time()

    distancia = (pulse_end - pulse_start) * 34300 / 2
    return distancia if DISTANCIA_MIN <= distancia <= DISTANCIA_MAX else None


def filtro_mediana(datos, window_size=3):
    """Aplica filtro de mediana ignorando None."""
    datos_validos = [d for d in datos if d is not None]
    if not datos_validos:
        return None
    return np.median(datos_validos[-window_size:])


try:
    while True:
        distancias, temperaturas = [], []

        for _ in range(NUM_SAMPLES):
            distancia = medir_distancia()
            if distancia is not None:
                distancias.append(distancia)
                temperaturas.append(bme_sensor.get_data()["temperature"])
            time.sleep(0.1)

        # Filtrado y cálculos
        distancia_filtrada = filtro_mediana(distancias, window_size=3)
        if distancia_filtrada is None:
            continue  # Si todas las lecturas son inválidas, reinicia el ciclo

        avg_temp = round(sum(temperaturas) / len(temperaturas), 2)
        timestamp = datetime.datetime.now().isoformat()

        resultado = {
            "temperature": avg_temp,
            "distance_cm": round(distancia_filtrada, 2),
            "timestamp": timestamp,
        }

        print(json.dumps(resultado, indent=2))

except KeyboardInterrupt:
    GPIO.cleanup()
