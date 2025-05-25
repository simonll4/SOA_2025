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
parser.add_argument("--height", type=float, required=True, help="Altura del recipiente en cm")
args = parser.parse_args()

DISTANCIA_MAX = args.height  # Sobrescribe el valor fijo

# Parámetros ajustables
NUM_SAMPLES = 10          # Muestras por ciclo
#DISTANCIA_MAX = 100       # Máxima distancia válida (cm)
DISTANCIA_MIN = 2         # Mínima distancia válida (evita ruido eléctrico)

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



# import time
# import datetime
# import json
# import RPi.GPIO as GPIO
# from bme280pi import Sensor

# # Configuración del sensor BME280
# bme_sensor = Sensor(address=0x76)

# # Configuración del sensor HC-SR04
# TRIG = 23
# ECHO = 24
# GPIO.setmode(GPIO.BCM)
# GPIO.setup(TRIG, GPIO.OUT)
# GPIO.setup(ECHO, GPIO.IN)

# # Parámetro configurable: cantidad de muestras por ciclo
# NUM_SAMPLES = 10


# def medir_distancia():
#     GPIO.output(TRIG, True)
#     time.sleep(0.00001)
#     GPIO.output(TRIG, False)

#     while GPIO.input(ECHO) == 0:
#         start = time.time()

#     while GPIO.input(ECHO) == 1:
#         end = time.time()

#     return (end - start) * 34300 / 2  # cm


# try:
#     while True:
#         temperaturas = []
#         distancias = []

#         for _ in range(NUM_SAMPLES):
#             bme_data = bme_sensor.get_data()
#             distancia = medir_distancia()

#             temperaturas.append(bme_data["temperature"])
#             distancias.append(distancia)

#             time.sleep(0.1)  # espera entre muestras para mejor dispersión

#         # Calcular promedios
#         avg_temp = round(sum(temperaturas) / NUM_SAMPLES, 2)
#         avg_dist = round(sum(distancias) / NUM_SAMPLES, 2)
#         timestamp = datetime.datetime.now().isoformat()

#         # Crear y mostrar resultado
#         resultado = {
#             "temperature": avg_temp,
#             "distance_cm": avg_dist,
#             "timestamp": timestamp,
#         }

#         print(json.dumps(resultado, indent=2))

# except KeyboardInterrupt:
#     GPIO.cleanup()
# import time
# import datetime
# import json
# import RPi.GPIO as GPIO
# from bme280pi import Sensor

# # Configuración del sensor BME280
# bme_sensor = Sensor(address=0x76)

# # Configuración del sensor HC-SR04
# TRIG = 23
# ECHO = 24
# GPIO.setmode(GPIO.BCM)
# GPIO.setup(TRIG, GPIO.OUT)
# GPIO.setup(ECHO, GPIO.IN)

# # Parámetro configurable: cantidad de muestras por ciclo
# NUM_SAMPLES = 10


# def medir_distancia():
#     GPIO.output(TRIG, True)
#     time.sleep(0.00001)
#     GPIO.output(TRIG, False)

#     while GPIO.input(ECHO) == 0:
#         start = time.time()

#     while GPIO.input(ECHO) == 1:
#         end = time.time()

#     return (end - start) * 34300 / 2  # cm


# try:
#     while True:
#         temperaturas = []
#         distancias = []

#         for _ in range(NUM_SAMPLES):
#             bme_data = bme_sensor.get_data()
#             distancia = medir_distancia()

#             temperaturas.append(bme_data["temperature"])
#             distancias.append(distancia)

#             time.sleep(0.1)  # espera entre muestras para mejor dispersión

#         # Calcular promedios
#         avg_temp = round(sum(temperaturas) / NUM_SAMPLES, 2)
#         avg_dist = round(sum(distancias) / NUM_SAMPLES, 2)
#         timestamp = datetime.datetime.now().isoformat()

#         # Crear y mostrar resultado
#         resultado = {
#             "temperature": avg_temp,
#             "distance_cm": avg_dist,
#             "timestamp": timestamp,
#         }

#         print(json.dumps(resultado, indent=2))

# except KeyboardInterrupt:
#     GPIO.cleanup()


# # import time
# # import datetime
# # import json
# # import RPi.GPIO as GPIO
# # from bme280pi import Sensor


# # class SensorMonitor:
# #     def __init__(self):
# #         # Configuración inicial
# #         self.num_samples = 10  # Muestras por ciclo
# #         self.sample_delay = 0.1  # Espera entre muestras (segundos)

# #         # Inicializar sensor BME280
# #         self.bme_sensor = Sensor(address=0x76)

# #         # Configuración HC-SR04
# #         self.TRIG = 23
# #         self.ECHO = 24
# #         self.setup_gpio()

# #     def setup_gpio(self):
# #         """Configura los pines GPIO una sola vez"""
# #         GPIO.setmode(GPIO.BCM)
# #         GPIO.setwarnings(False)  # Evita el warning de canales en uso
# #         GPIO.setup(self.TRIG, GPIO.OUT)
# #         GPIO.setup(self.ECHO, GPIO.IN)
# #         # Asegurar que el TRIG empiece apagado
# #         GPIO.output(self.TRIG, False)
# #         time.sleep(0.1)  # Pequeña pausa para estabilizar

# #     def medir_distancia(self):
# #         """Mide distancia con HC-SR04 y retorna en cm"""
# #         # Generar pulso de trigger
# #         GPIO.output(self.TRIG, True)
# #         time.sleep(0.00001)
# #         GPIO.output(self.TRIG, False)

# #         # Esperar por el eco
# #         start = end = time.time()

# #         timeout = time.time() + 0.04  # Timeout de 40ms (~7m de distancia máxima)
# #         while GPIO.input(self.ECHO) == 0 and time.time() < timeout:
# #             start = time.time()

# #         while GPIO.input(self.ECHO) == 1 and time.time() < timeout:
# #             end = time.time()

# #         # Calcular distancia (cm)
# #         duracion = end - start
# #         distancia = (duracion * 34300) / 2

# #         # Validar lectura (rango típico HC-SR04: 2cm-400cm)
# #         return max(2, min(400, round(distancia, 2)))

# #     def obtener_datos(self):
# #         """Obtiene datos promediados de ambos sensores"""
# #         temperaturas = []
# #         distancias = []

# #         for _ in range(self.num_samples):
# #             try:
# #                 bme_data = self.bme_sensor.get_data()
# #                 distancia = self.medir_distancia()

# #                 temperaturas.append(bme_data["temperature"])
# #                 distancias.append(distancia)

# #                 time.sleep(self.sample_delay)
# #             except Exception as e:
# #                 print(f"Error en muestra: {str(e)}")
# #                 continue

# #         # Calcular promedios
# #         avg_temp = (
# #             round(sum(temperaturas) / len(temperaturas), 2) if temperaturas else 0
# #         )
# #         avg_dist = round(sum(distancias) / len(distancias), 2) if distancias else 0

# #         return {
# #             "temperature": avg_temp,
# #             "distance_cm": avg_dist,
# #             "timestamp": datetime.datetime.now().isoformat(),
# #             "samples": self.num_samples,
# #         }

# #     def run(self):
# #         """Bucle principal de monitoreo"""
# #         try:
# #             while True:
# #                 datos = self.obtener_datos()
# #                 print(json.dumps(datos, indent=2))
                

# #         except KeyboardInterrupt:
# #             print("\nDeteniendo monitor...")
# #         finally:
# #             GPIO.cleanup()
# #             print("GPIO limpiado correctamente")


# # if __name__ == "__main__":
# #     monitor = SensorMonitor()
# #     monitor.run()