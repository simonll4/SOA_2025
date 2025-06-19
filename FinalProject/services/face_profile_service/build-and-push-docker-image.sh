#!/bin/bash
# This script builds and pushes the Docker image for the Face Profile Service.
docker build --no-cache -t simonll4/face_profile_service:2.0 .
docker push simonll4/face_profile_service:2.0
