#!/bin/bash
# This script builds and pushes the Docker image for the Keycloak Sync Service.
docker build -t simonll4/keycloak_sync_service:1.0 .
docker push simonll4/keycloak_sync_service:1.0
