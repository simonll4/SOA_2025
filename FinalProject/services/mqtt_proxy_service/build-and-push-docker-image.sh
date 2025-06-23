#!/bin/bash
# This script builds and pushes the Docker image for the MQTT Proxy Service.
docker build --no-cache -t simonll4/mqtt_proxy_service:1.1 .
docker push simonll4/mqtt_proxy_service:1.1
