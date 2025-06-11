#!/usr/bin/env python3

import RPi.GPIO as GPIO
import time
import sys

SERVO_PIN = 17
FREQ = 50

if len(sys.argv) != 2:
    print("Uso: python3 servo_angle.py <ángulo 0-180>")
    sys.exit(1)

try:
    angle = float(sys.argv[1])
    if not 0 <= angle <= 180:
        raise ValueError
except ValueError:
    print("Ángulo inválido. Debe ser un número entre 0 y 180.")
    sys.exit(1)

GPIO.setmode(GPIO.BCM)
GPIO.setup(SERVO_PIN, GPIO.OUT)

pwm = None
try:
    pwm = GPIO.PWM(SERVO_PIN, FREQ)
    pwm.start(0)

    duty = 2.5 + (angle / 180.0) * (12.5 - 2.5)
    for _ in range(3):
        pwm.ChangeDutyCycle(duty)
        time.sleep(0.1)
    pwm.ChangeDutyCycle(0)

finally:
    if pwm is not None:
        pwm.stop()
    GPIO.cleanup()
