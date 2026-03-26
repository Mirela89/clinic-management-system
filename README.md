# MediCare

![Java](https://img.shields.io/badge/Java-21-orange?logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-TypeScript-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)

Web application for managing the activity of a private medical clinic, developed for the **Web Applications for Databases** course.

## Description

**MediCare** aims to digitize the main activities of a medical clinic:

- patient and doctor management;
- consultation scheduling;
- consultation and prescription records;
- department and insurance administration;
- notifications and traceability for important actions.

## Project goal

The goal is to build a web application that allows:

- management of the main clinic entities;
- role-based access: `ADMIN`, `DOCTOR`, `PATIENT`;
- implementation of the mandatory project requirements: data model, CRUD, validation, security, pagination, logging, and testing;
- preparation for a possible future migration to microservices.

## Main technologies

- **Backend:** Spring Boot, Java 21
- **Frontend:** React, TypeScript
- **Development database:** PostgreSQL
- **Test database:** H2
- **Persistence:** Spring Data JPA / Hibernate
- **Security:** Spring Security
- **Testing:** JUnit 5, Mockito

## Data model

### Main entities

- `users`
- `patients`
- `doctors`
- `departments`
- `insurances`
- `appointments`
- `consultations`
- `prescriptions`
- `medications`

### Main relationships

- `@OneToOne`
  - `patients -> users`
  - `doctors -> users`
  - `departments -> headDoctor`
  - `consultations -> appointments`
- `@OneToMany / @ManyToOne`
  - `departments -> doctors`
  - `insurances -> patients`
  - `patients -> appointments`
  - `doctors -> appointments`
  - `consultations -> prescriptions`
- `@ManyToMany`
  - `prescriptions <-> medications`

## ER Diagram

> Full interactive diagram: [dbdiagram.io/d/MediCare](https://dbdiagram.io/d/MediCare-69b17fe677d079431b5e4768)

<p align="center">
  <img src="https://github.com/user-attachments/assets/5f02724b-27da-49a9-b6d6-520fa3b9ddb0" 
       alt="MediCare ER Diagram" 
       width="800"/>
</p>

## Team

| Nume | GitHub |
|------|--------|
| Ojoc Diana-Cristiana | [@CristianaOD](https://github.com/CristianaOD) |
| Ruka Mirela | [@Mirela89](https://github.com/Mirela89) |
