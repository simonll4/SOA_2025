def validate_command(topic, message):
    if topic == "/led":
        if message not in ["on", "off"]:
            return False, "Mensaje inválido para /led. Usa 'on' o 'off'."
        return True, ""

    elif topic == "/moveservo":
        try:
            degrees = int(message)
            if 0 <= degrees <= 180:
                return True, ""
            return False, "Ángulo fuera de rango (0-180)."
        except ValueError:
            return False, "Mensaje inválido. Debe ser un número."

    elif topic == "/rgb":
        try:
            parts = list(map(int, message.split()))
            if len(parts) != 3 or not all(0 <= val <= 255 for val in parts):
                return (
                    False,
                    "RGB debe tener 3 valores entre 0 y 255 separados por espacio.",
                )
            return True, ""
        except Exception:
            return False, "Mensaje inválido. Debe ser 3 números separados por espacio."

    else:
        return False, "Topic no permitido."
