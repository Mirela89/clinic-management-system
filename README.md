# MediCare+

![Java](https://img.shields.io/badge/Java-21-orange?logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-TypeScript-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions)

Web application for managing the activity of a private medical clinic, developed for the **Web Applications for Databases** course. Built with a **microservices architecture** using Spring Boot and React.

## Live Demo

| Service | URL |
|---|---|
| Frontend | [medicare-frontend-l3e5.onrender.com](https://medicare-frontend-l3e5.onrender.com) |
| API Gateway | [medicare-gateway-cwpx.onrender.com](https://medicare-gateway-cwpx.onrender.com) |
| Eureka Dashboard | [medicare-discovery.onrender.com](https://medicare-discovery.onrender.com) |

> ⚠️ Free tier services may take 30–60 seconds to wake up on first request.


## Description

**MediCare+** digitizes the main activities of a private medical clinic:

- Patient and doctor management
- Consultation scheduling and records
- Prescription and medication management
- Department and insurance administration
- Audit logging and traceability for important actions
- Real-time notifications
- Medical analysis document storage

### Project goal

- Management of the main clinic entities
- Role-based access: `ADMIN`, `DOCTOR`, `PATIENT`
- Implementation of mandatory requirements: data model, CRUD, validation, security, pagination, logging, and testing
- Migration from a monolithic application to a **microservices architecture**

### Main Technologies

- **Backend:** Spring Boot 3.5, Java 21, Spring Cloud
- **Frontend:** React 18, TypeScript
- **Relational database:** PostgreSQL 16
- **Document database:** MongoDB Atlas
- **Test database:** H2 (in-memory)
- **Persistence:** Spring Data JPA / Hibernate, Spring Data MongoDB
- **Security:** Spring Security, JWT
- **Testing:** JUnit 5, Mockito
- **Monitoring:** Spring Boot Actuator, Prometheus, Grafana, Zipkin
- **Infrastructure:** Docker, Docker Compose, GitHub Actions, Render

---

## Architecture

MediCare+ was migrated from a monolithic application into **5 independent microservices**:

```
                        ┌─────────────────┐
                        │   React Frontend │
                        │  (TypeScript)    │
                        └────────┬────────┘
                                 │ HTTPS
                        ┌────────▼────────┐
                        │   API Gateway   │
                        │   (port 8085)   │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
    ┌─────────▼──────┐  ┌────────▼───────┐  ┌───────▼────────┐
    │  User Service  │  │ Medical Service│  │   Notification │
    │  (port 8081)   │  │  (port 8082)   │  │  (port 8083)   │
    └─────────┬──────┘  └────────┬───────┘  └───────┬────────┘
              │                  │                   │
    ┌─────────▼──────┐  ┌────────▼───────┐          │
    │  PostgreSQL DB  │  │  PostgreSQL DB │          │
    │  (Users)        │  │  (Medical)     │          │
    └────────────────┘  └────────┬───────┘          │
                                 │                   │
                        ┌────────▼───────────────────▼──┐
                        │         MongoDB Atlas          │
                        │  (Analyses, Consultations,     │
                        │   Appointments, Prescriptions) │
                        └───────────────────────────────┘

    ┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Discovery Server│     │  Prometheus  │     │   Grafana    │
    │ Eureka (8761)   │     │  (port 9090) │     │  (port 3000) │
    └─────────────────┘     └──────────────┘     └──────────────┘
```

### Microservices

| Service | Port | Responsibility | Database |
|---|---|---|---|
| `discovery-server` | 8761 | Eureka service registry | — |
| `api-gateway` | 8085 | Routing, CORS, request filtering | — |
| `user-service` | 8081 | Authentication, JWT, users, patients, doctors | PostgreSQL |
| `medical-service` | 8082 | Consultations, prescriptions, medications, appointments | PostgreSQL + MongoDB |
| `notification-service` | 8083 | Notifications | PostgreSQL |

---

## Implemented Requirements

Click each requirement below to see implementation details, decisions made, and screenshots.

### Part I - Mandatory Requirements

<details>
<summary><b>1. Data Model</b></summary>

<br>

**Requirements:** Minimum 6-7 interconnected entities, all relationship types (`@OneToOne`, `@OneToMany/@ManyToOne`, `@ManyToMany`), documented ER diagram.

**What we did:**
- 9+ entities: `users`, `patients`, `doctors`, `departments`, `insurances`, `appointments`, `consultations`, `prescriptions`, `medications`
- `@OneToOne`: `patients → users`, `doctors → users`, `consultations → appointments`
- `@OneToMany / @ManyToOne`: `departments → doctors`, `insurances → patients`, `patients → appointments`, `doctors → appointments`, `consultations → prescriptions`
- `@ManyToMany`: `prescriptions ↔ medications`
- Full interactive ER diagram on [dbdiagram.io](https://dbdiagram.io/d/MediCare-69b17fe677d079431b5e4768)

<p align="center">
  <img src="https://github.com/user-attachments/assets/5f02724b-27da-49a9-b6d6-520fa3b9ddb0" alt="MediCare ER Diagram" width="700"/>
</p>

</details>

<details>
<summary><b>2. Complete CRUD Operations</b></summary>

<br>

**Requirements:** Create, Read, Update, Delete for all entities, Repository pattern, Service layer with business logic, specific exception handling.

**What we did:**
- Full CRUD on every entity via Spring Data JPA repositories
- Custom queries via naming convention and `@Query` (JPQL) for complex lookups (e.g. `findByPatientUserIdOrderByAppointmentDateDesc`)
- Service layer with business validations (duplicate checks, role validation, dependency checks before delete)
- Custom exceptions: `ResourceNotFoundException` (404), `BusinessException` (400)
- Centralized `GlobalExceptionHandler` with `@RestControllerAdvice` and field-specific validation error messages

**Screenshot - Admin CRUD page (Departments):**

<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/ba04bf3d-ddcb-4f59-bc5f-b8d31835aa2a" />

</details>

<details>
<summary><b>3. Multi-Environment Configuration</b></summary>

<br>

**Requirements:** Minimum 2 Spring profiles (dev, test), 2 different databases, separate configuration files.

**What we did:**
- `dev` profile → PostgreSQL 16 (Docker, port 5433/5432)
- `test` profile → H2 in-memory, `ddl-auto: create-drop`
- Separate files: `application.yaml` (common), `application-dev.yaml`, `application-test.yaml`
- Sensitive credentials externalized via environment variables (`${DB_HOST}`, `${DB_PASSWORD}`, `${MONGODB_URI}`, `${JWT_SECRET}`)

</details>

<details>
<summary><b>4. Testing</b></summary>

<br>

**Requirements:** Unit tests (70%+ service layer coverage), 3+ integration test scenarios, JUnit 5 + Mockito, test database.

**What we did:**
- Unit tests with JUnit 5 + Mockito, mocking repositories for service layer logic
- Integration tests with `@SpringBootTest` + `TestRestTemplate` against the H2 test database
- Dedicated `test` profile fully isolated from dev data

**Screenshot - test run results:**

<img width="637" height="472" alt="image" src="https://github.com/user-attachments/assets/f42dc92a-2b11-4cf3-9432-9e92192991d4" />

</details>

<details>
<summary><b>5. Views and Validation</b></summary>

<br>

**Requirements:** Modern frontend framework, CRUD forms, server-side + client-side validation, user-friendly error messages, custom error pages (404, 500).

**What we did:**
- React 18 + TypeScript + TailwindCSS + TanStack Query + React Router v6
- **Admin pages:** Dashboard, Patients, Doctors, Appointments, Consultations, Departments, Insurances, Medications
- **Doctor pages:** Dashboard, Appointments, Patients, Consultations (with prescriptions + medication search), Schedule
- **Patient pages:** Dashboard, Appointments (with booking wizard), Consultations, Prescriptions, Analyses
- Server-side validation with Bean Validation (`@NotBlank`, `@NotNull`, `@Email`, `@Pattern`, `@FutureOrPresent`, etc.)
- Client-side validation with user-friendly inline messages
- Custom `404` and `500` error pages

**Screenshots:**

| Login | Dashboard |
|---|---|
<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/3aa53c04-b51e-45ef-bfe4-257886f58f25" />

<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/9d96becd-a3d8-4e21-96ae-03681a579006" />

| Appointments (Admin) | 500 Error Page |
|---|---|
<img width="1917" height="913" alt="image" src="https://github.com/user-attachments/assets/e17abf22-aac8-40c0-a7bc-e616bbc0ce66" />

</details>

<details>
<summary><b>6. Logging</b></summary>

<br>

**Requirements:** SLF4J + Logback/Log4j2, correctly configured log levels (INFO, DEBUG, ERROR), separate log files for errors.

**What we did:**
- SLF4J + Logback (included by default in Spring Boot)
- `@Slf4j` on all service implementations with appropriate log levels
- Custom `AuditLogService` - persists important actions (`LOGIN`, `ACCESS_DENIED`, etc.) to the database with IP address and timestamp for traceability
- Hibernate SQL logging enabled in `dev` profile for debugging

</details>

<details>
<summary><b>7. Pagination and Sorting</b></summary>

<br>

**Requirements:** `Pageable` for minimum 3 entities, sorting by 2+ criteria per entity, pagination UI.

**What we did:**
- `Pageable` implemented on `Appointment`, `Patient`, `Medication`, `Consultation`
- Sorting options: appointments by date/status, patients by last name/date of birth, medications by name/active substance
- Frontend pagination controls with page size selection and status filters (see Appointments page)

**Screenshot:**

<img width="1640" height="371" alt="image" src="https://github.com/user-attachments/assets/531ff2d2-6207-4a5b-a0b5-0de68f931b2b" />

<img width="1917" height="915" alt="image" src="https://github.com/user-attachments/assets/01f7d0be-e2c0-4f91-8c85-54877aa52c37" />

</details>

<details>
<summary><b>8. Spring Security</b></summary>

<br>

**Requirements (minimum):** JDBC authentication, 2+ roles, role-based endpoint protection, custom login page, functional logout.
**Requirements (recommended):** BCrypt password encoding, remember-me, CSRF protection.

**What we did:**
- JDBC authentication via `UserDetailsService` + `DaoAuthenticationProvider`
- 3 roles: `ADMIN`, `DOCTOR`, `PATIENT` with role-based endpoint protection
- BCrypt password encoding
- Remember-me functionality (7-day token validity)
- Custom login/register pages built in React
- **Upgraded to JWT authentication** (see Distributed Security section below) - tokens issued on login, validated on every request via a custom `JwtAuthFilter`
- CSRF disabled in favor of stateless JWT (documented trade-off, common practice for token-based APIs)

</details>

---

### Part II - Optional Requirements: Microservices

> The monolithic application was migrated into **5 independent microservices**: `discovery-server`, `api-gateway`, `user-service`, `medical-service`, `notification-service`.

<details>
<summary><b>2. Service Discovery and Communication</b></summary>

<br>

**Requirements:** Functional service registry, inter-service communication, automatic service discovery.

**What we did:**
- Netflix Eureka as the service registry (`discovery-server`)
- All microservices auto-register with Eureka on startup
- REST communication between services through the API Gateway
- Eureka dashboard demonstrates live service discovery and health status

**Screenshot - Eureka dashboard:**

<img width="1917" height="967" alt="image" src="https://github.com/user-attachments/assets/bf041dd1-7178-46cb-8e5e-6448a08d9945" />

</details>

<details>
<summary><b>4. API Gateway</b></summary>

<br>

**Requirements:** Centralized routing, rate limiting, request/response filtering.

**What we did:**
- Spring Cloud Gateway routes all client requests to the appropriate microservice
- Centralized CORS configuration for all allowed frontend origins
- Request/response filtering at the gateway level

</details>

<details>
<summary><b>5. Monitoring and Metrics</b></summary>

<br>

**Requirements:** Exposed Actuator endpoints, metrics dashboard (CPU, memory, requests), health checks for all services, distributed tracing (bonus).

**What we did:**
- Spring Boot Actuator exposed on every microservice (`/actuator/health`, `/actuator/metrics`)
- **Prometheus** scrapes metrics from all services every few seconds
- **Grafana** dashboard (imported Spring Boot dashboard, ID `4701`) visualizing CPU, memory, and HTTP request metrics in real time
- **Zipkin** integrated for distributed tracing across microservices (bonus requirement)

**Screenshots:**

Prometheus targets | Grafana dashboard | Zipkin

<img width="1917" height="686" alt="image" src="https://github.com/user-attachments/assets/e25d131b-c1da-400c-91a0-983748d5c821" />

<img width="1917" height="966" alt="image" src="https://github.com/user-attachments/assets/e6354847-391c-483a-8562-c0e7b08ab82a" />

<img width="1917" height="958" alt="image" src="https://github.com/user-attachments/assets/e1a47662-c5a7-48ac-beb9-a3ffb3951633" />

</details>

<details>
<summary><b>6. Distributed Security</b></summary>

<br>

**Requirements:** JWT authentication between microservices OR OAuth2/Keycloak, secure communication (HTTPS bonus).

**What we did:**
- JWT-based authentication implemented in `user-service`:
  - On login, `user-service` issues a signed JWT (HMAC-SHA, `io.jsonwebtoken`) containing username, role, and user ID claims
  - Token is returned to the frontend and stored client-side
  - A custom `JwtAuthFilter` validates the token on every authenticated request, replacing session-based authentication
  - This solved a real cross-origin cookie issue we encountered when the frontend and backend were deployed on different Render subdomains - session cookies were blocked by browsers on external devices, while JWT (sent via `Authorization` header) works reliably across origins and devices
- HTTPS active by default on Render deployment (bonus)

</details>

<details>
<summary><b>9. NoSQL and Caching</b></summary>

<br>

**Requirements:** Minimum 1 NoSQL database integration, caching layer, demonstrated performance benefits.

**What we did:**
- **MongoDB Atlas** integrated in `medical-service` for `consultations`, `appointments`, `prescriptions`, and `medical analysis` documents - a polyglot persistence approach (PostgreSQL for structured/relational data, MongoDB for flexible document data)
- **Caffeine in-memory cache** applied to frequently-read data (medications, departments, doctors) with `@Cacheable` / `@CacheEvict`

</details>

<details>
<summary><b>11. CI/CD Pipeline</b></summary>

<br>

**Requirements:** Automated build, automated test runs, automated deployment, Docker containerization.

**What we did:**
- GitHub Actions workflow (`.github/workflows/ci.yml`) triggered on push to `main`, `dev`, `feature/*`:
  - Build & test all Spring Boot services (Maven)
  - Build frontend (npm)
  - Verify Docker build for every service
- Every microservice fully Dockerized with its own `Dockerfile`
- `docker-compose-microservices.yml` orchestrates the entire stack locally (5 services + PostgreSQL + Prometheus + Grafana + Zipkin)
- Automatic deployment to Render triggered on every push to `main`

**Screenshot - GitHub Actions pipeline:**

<img width="1917" height="770" alt="image" src="https://github.com/user-attachments/assets/e40f7ee9-cb7a-4258-8323-a4fb3cbf0248" />

</details>

---

## Setup Instructions

### Prerequisites

- Java 21
- Node.js 18+
- Docker & Docker Compose
- Maven 3.9+

### Option 1 - Run with Docker Compose (recommended)

```bash
git clone https://github.com/Mirela89/clinic-management-system.git
cd clinic-management-system

cp .env.example .env
# edit .env with your values

docker-compose -f docker-compose-microservices.yml up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| API Gateway | http://localhost:8085 |
| Eureka | http://localhost:8761 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| Zipkin | http://localhost:9411 |

To stop:
```bash
docker-compose -f docker-compose-microservices.yml down
```

### Option 2 - Use the live deployment on Render
 
The application is already deployed and publicly accessible (see [Live Demo](#-live-demo) above) - no local setup required.
 
> ⚠️ Services run on Render's **free tier**, which spins down after 15 minutes of inactivity. The first request after idle time can take 30–60 seconds while the service wakes up.
 
To avoid waiting on each service individually, run the included wake-up script before a demo or presentation:
 
```powershell
.\wake-up.ps1
```
 
This pings the health endpoint of every microservice (`discovery-server` first, then `user-service`, `notification-service`, `medical-service`, and `api-gateway` last) so they all finish starting up before you open the frontend. Wait 2–3 minutes after running it, then visit:
 
```
https://medicare-frontend-l3e5.onrender.com
```
 
You can also check the current status of all registered services anytime via the Eureka dashboard:

```
https://medicare-discovery.onrender.com
```

### Environment Variables

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medicare_db
DB_USERNAME=postgres
DB_PASSWORD=your_password

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/

# JWT
JWT_SECRET=your-secret-key-minimum-32-characters

# Eureka
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/
```

### Run Tests

```bash
mvn test                          # all services
cd user-service && mvn test       # specific service
```

---

## API Documentation

All requests go through the **API Gateway**: `http://localhost:8085` (local) or `https://medicare-gateway-cwpx.onrender.com` (production).

### Main Endpoints

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Current user info | Authenticated |
| GET | `/api/patients` | List patients (paginated) | ADMIN, DOCTOR |
| GET | `/api/patients/{id}` | Patient details | ADMIN, DOCTOR, PATIENT (own) |
| GET | `/api/doctors` | List doctors | All |
| GET | `/api/departments` | List departments | All |
| GET | `/api/appointments` | List appointments (paginated, sortable) | Authenticated |
| POST | `/api/appointments` | Create appointment | PATIENT |
| PATCH | `/api/appointments/{id}/cancel` | Cancel appointment | PATIENT, DOCTOR, ADMIN |
| GET | `/api/consultations` | List consultations | Authenticated |
| POST | `/api/consultations` | Create consultation | DOCTOR |
| GET | `/api/medications` | List medications (paginated, searchable) | Authenticated |
| GET | `/api/prescriptions` | List prescriptions | Authenticated |

### Swagger UI

- User Service: `http://localhost:8081/swagger-ui.html`
- Medical Service: `http://localhost:8082/swagger-ui.html`

---

## Screenshots

<details>
<summary><b>Click to expand full screenshot gallery</b></summary>

| Login | Register |
|---|---|
<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/5fc57042-e83b-47db-8ed5-ea7cc8b5df02" />

| Admin Dashboard | Doctor Dashboard |
|---|---|
<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/00a2d63e-abbc-4e0c-8bb7-c87daa131ed4" />

<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/3811afdc-2f9a-49e6-a8af-6647d3b4098e" />

<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/74092404-a2f1-44bf-80bf-ec1fb9d4122b" />

| Patient Dashboard | Appointments |
|---|---|
<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/7972a394-3c62-40fe-af11-8016b0df56ff" />

<img width="1917" height="917" alt="image" src="https://github.com/user-attachments/assets/0e4acdec-1f09-43cd-b9e0-233dc3094a47" />

</details>

## Team Contributions

| Member | GitHub | Contributions |
|---|---|---|
| Ojoc Diana-Cristiana | [@CristianaOD](https://github.com/CristianaOD) | 50% |
| Ruka Mirela | [@Mirela89](https://github.com/Mirela89) | 50% |

---

## Project Structure

```
clinic-management-system/
├── discovery-server/          # Eureka Service Registry
├── api-gateway/               # Spring Cloud Gateway
├── user-service/              # Auth, JWT, Users, Patients, Doctors
├── medical-service/           # Consultations, Prescriptions, Medications
├── notification-service/      # Notifications
├── frontend/                  # React TypeScript App
├── monitoring/
│   ├── prometheus/             # Prometheus config
│   └── grafana/                 # Grafana dashboards
├── .github/workflows/         # GitHub Actions CI/CD
├── docker-compose-microservices.yml
├── wake-up.ps1                 # Script to wake Render free-tier services
└── README.md
```

---

## License

This project was developed for the **Web Applications for Databases** course.
