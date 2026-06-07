# Infrastructure Demo

This document maps the current microservices infrastructure to the project requirements.

## Start the microservices stack

```powershell
docker compose -f docker-compose-microservices.yml up --build
```

If the images are already built:

```powershell
docker compose -f docker-compose-microservices.yml up
```

Stop the stack:

```powershell
docker compose -f docker-compose-microservices.yml down
```

## Main URLs

- Frontend: http://localhost
- API Gateway: http://localhost:8085
- Eureka Discovery Server: http://localhost:8761
- User Service: http://localhost:8081
- Medical Service: http://localhost:8082
- Notification Service: http://localhost:8083
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Zipkin: http://localhost:9411

Grafana credentials:

- User: `admin`
- Password: `admin1`

## CI/CD Pipeline

GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

Currently implemented:

- automated Maven build for the microservices modules
- automated Maven verification step
- automated frontend build
- Docker image build validation with `docker-compose-microservices.yml`

Staging deployment is planned for the final deployment step.

## Monitoring and Metrics

Spring Boot Actuator is enabled on the microservices and exposes:

```text
/actuator/health
/actuator/metrics
/actuator/prometheus
```

Prometheus scrapes:

- Eureka Discovery Server
- API Gateway
- User Service
- Medical Service
- Notification Service

Grafana automatically provisions the `Medicare Observability` dashboard with:

- CPU usage
- heap memory usage
- HTTP request rate
- average request latency
- cache metrics

Zipkin is configured as the tracing backend. After generating traffic through the application, traces can be searched at:

```text
http://localhost:9411
```

## Health Checks

Docker Compose health checks are configured for:

- PostgreSQL
- Eureka Discovery Server
- API Gateway
- User Service
- Medical Service
- Notification Service

Example direct checks:

```powershell
curl http://localhost:8085/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
```

## Eureka Demo

Open:

```text
http://localhost:8761
```

Expected registered applications:

- `API-GATEWAY`
- `USER-SERVICE`
- `MEDICAL-SERVICE`
- `NOTIFICATION-SERVICE`

This demonstrates that services register themselves in Eureka and can be discovered by the gateway.
