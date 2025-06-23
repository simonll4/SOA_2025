#!/bin/bash
# This script builds and pushes the Docker image for the Face Recognition Service.
docker build --no-cache -t simonll4/face_recognition_service:1.0 .
docker push simonll4/face_profile_service:1.0
