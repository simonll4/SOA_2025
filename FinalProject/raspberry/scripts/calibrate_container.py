import json
import os
import time
import RPi.GPIO as GPIO

ARCHIVO_CONTENEDORES = "containers.json"
PIN_TRIG = 23
PIN_ECHO = 24
NUMERO_MUESTRAS = 10  # Número de medidas para calcular el promedio
DELAY_ENTRE_MUESTRAS = 0.06  # 60 ms (mínimo para HC-SR04)

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

def medir_distancia_promedio():
    print(f"🔍 Tomando {NUMERO_MUESTRAS} medidas...")
    medidas = []
    for i in range(NUMERO_MUESTRAS):
        distancia = medir_distancia()
        medidas.append(distancia)
        print(f"Medida {i+1}/{NUMERO_MUESTRAS}: {distancia} cm")
        time.sleep(DELAY_ENTRE_MUESTRAS)
    
    # Descarta outliers (opcional)
    medidas.sort()
    medidas = medidas[1:-1]  # Elimina el mínimo y máximo
    
    promedio = round(sum(medidas) / len(medidas), 2)
    print(f"Promedio de {len(medidas)} medidas válidas: {promedio} cm")
    return promedio

def buscar_contenedor(lista, id_busqueda):
    for c in lista:
        if c["id"] == id_busqueda:
            return c
    return None

def calibrar_sensor_fondo():
    print("\nCalibrando sensor de fondo...")
    print("Asegúrese de que el contenedor esté VACÍO y el sensor apunte al fondo.")
    input("Presione Enter cuando esté listo...")
    
    distancia = medir_distancia_promedio()
    print(f"\nDistancia al fondo calibrada: {distancia} cm")
    return distancia

def main():
    contenedores = cargar_contenedores()
    contenedor_id = input("Ingrese el ID del contenedor: ").strip()
    contenedor = buscar_contenedor(contenedores, contenedor_id)

    if not contenedor:
        altura = float(input("\nContenedor no encontrado. Ingrese la altura del contenedor en cm: "))
        altura_sensor_fondo = calibrar_sensor_fondo()
        
        contenedor = {
            "id": contenedor_id,
            "height": altura,
            "sensor_height": altura_sensor_fondo,
            "calibration_table": [{"height": 0, "volume": 0.0}],  # Punto inicial
        }
        contenedores.append(contenedor)
        print(f"\nContenedor '{contenedor_id}' creado:")
        print(f"  - Altura total: {altura} cm")
        print(f"  - Distancia sensor-fondo: {altura_sensor_fondo} cm")
    else:
        altura_sensor_fondo = contenedor.get("sensor_height")
        if not altura_sensor_fondo:
            print("\nContenedor no tiene calibración de sensor. Recalibrando...")
            altura_sensor_fondo = calibrar_sensor_fondo()
            contenedor["sensor_height"] = altura_sensor_fondo
            guardar_contenedores(contenedores)

    print(f"\n💡 Sensor calibrado a {altura_sensor_fondo} cm desde el fondo")

    # Medición actual
    distancia = medir_distancia_promedio()
    nivel = round(altura_sensor_fondo - distancia, 2)

    print(f"\nNivel calculado: {nivel} cm (Sensor a fondo: {altura_sensor_fondo} cm)")
    if nivel <= 0:
        print("Advertencia: El sensor puede estar detectando el fondo o fuera de rango.")
        nivel = 0  # Forzar a 0 si es negativo
    elif nivel > contenedor["height"]:
        print("Advertencia: Nivel superior a la altura del contenedor. Verifique la calibración.")
        return

    # Agregar punto de calibración
    volumen = float(input(f"\nIngrese los litros agregados al nivel de {nivel:.2f} cm: "))
    
    # Buscar si ya existe un punto para este nivel
    existe_punto = False
    for punto in contenedor["calibration_table"]:
        if punto["height"] == nivel:
            punto["volume"] = volumen
            existe_punto = True
            break
    
    if not existe_punto:
        contenedor["calibration_table"].append({"height": nivel, "volume": volumen})
    
    # Ordenar tabla por altura
    contenedor["calibration_table"].sort(key=lambda x: x["height"])
    
    guardar_contenedores(contenedores)
    
    print(f"\nRegistro guardado:")
    print(f"  - Nivel: {nivel} cm")
    print(f"  - Volumen: {volumen} L")
    print(f"\nTabla de calibración actualizada ({len(contenedor['calibration_table'])} puntos)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelado por el usuario.")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        GPIO.cleanup()