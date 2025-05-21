import json
import os
import time
import RPi.GPIO as GPIO

ARCHIVO_CONTENEDORES = "containers.json"
PIN_TRIG = 23
PIN_ECHO = 24

ALTURA_SENSOR_FONDO = 25.76  # cm


def cargar_contenedores():
    if not os.path.exists(ARCHIVO_CONTENEDORES):
        return []
    with open(ARCHIVO_CONTENEDORES, "r") as f:
        return json.load(f)


def guardar_contenedores(data):
    with open(ARCHIVO_CONTENEDORES, "w") as f:
        json.dump(data, f, indent=2)


def medir_distancia(trig=PIN_TRIG, echo=PIN_ECHO):
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(trig, GPIO.OUT)
    GPIO.setup(echo, GPIO.IN)

    GPIO.output(trig, False)
    time.sleep(0.1)

    GPIO.output(trig, True)
    time.sleep(0.00001)
    GPIO.output(trig, False)

    timeout = time.time() + 0.05
    pulse_start = time.time()
    while GPIO.input(echo) == 0 and time.time() < timeout:
        pulse_start = time.time()
    pulse_end = time.time()
    while GPIO.input(echo) == 1 and time.time() < timeout:
        pulse_end = time.time()

    GPIO.cleanup()

    duracion_pulso = pulse_end - pulse_start
    distancia = duracion_pulso * 17150
    return round(distancia, 2)


def buscar_contenedor(lista, id_busqueda):
    for c in lista:
        if c["id"] == id_busqueda:
            return c
    return None


def main():
    contenedores = cargar_contenedores()
    contenedor_id = input("Ingrese el ID del contenedor: ").strip()
    contenedor = buscar_contenedor(contenedores, contenedor_id)

    if not contenedor:
        altura = float(
            input("Contenedor no encontrado. Ingrese la altura del contenedor en cm: ")
        )
        altura_sensor_fondo = ALTURA_SENSOR_FONDO
        contenedor = {
            "id": contenedor_id,
            "height": altura,
            "calibration_table": [],
        }
        contenedores.append(contenedor)
        print(
            f"✅ Contenedor '{contenedor_id}' creado. Altura: {altura} cm | Sensor al fondo: {altura_sensor_fondo} cm"
        )

    distancia = medir_distancia()
    print(f"📏 Distancia medida: {distancia} cm")

    nivel = round(altura_sensor_fondo - distancia, 2)

    print(f"📏 Nivel calculado: {nivel} cm (Sensor a fondo: {altura_sensor_fondo} cm)")
    if nivel <= 0 or nivel > contenedor["height"]:
        print(
            "⚠️  Nivel calculado fuera de rango. Verifique el sensor o la altura configurada."
        )
        return

    volumen = float(input(f"Ingrese los litros agregados al nivel de {nivel:.2f} cm: "))
    contenedor["calibration_table"].append({"height": nivel, "volume": volumen})
    contenedor["calibration_table"].sort(key=lambda x: x["height"])

    guardar_contenedores(contenedores)
    print(f"✅ Registro guardado: Nivel = {nivel} cm | Volumen = {volumen} L")
    print("📌 Tabla de calibración actualizada correctamente.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⛔ Cancelado por el usuario.")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        GPIO.cleanup()
