import face_recognition
import numpy as np
from werkzeug.datastructures import FileStorage
import io


def generate_embedding(file: FileStorage) -> list[float]:
    content = file.read()
    image = face_recognition.load_image_file(io.BytesIO(content))
    encodings = face_recognition.face_encodings(image)

    if not encodings:
        raise ValueError("No se detectó ninguna cara en la imagen")

    vector = np.array(encodings[0], dtype=np.float32)

    # Validación de corrupción o longitud incorrecta
    if np.isnan(vector).any() or np.isinf(vector).any() or len(vector) != 128:
        raise ValueError("El vector de embedding está corrupto")

    # Normalización explícita
    norm = np.linalg.norm(vector)
    if norm == 0:
        raise ValueError("El vector tiene norma cero")
    vector = vector / norm

    return vector.tolist()
