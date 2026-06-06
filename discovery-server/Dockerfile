FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY discovery-server/pom.xml ./discovery-server/pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY user-service/pom.xml ./user-service/pom.xml
COPY medical-service/pom.xml ./medical-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml

RUN mvn dependency:go-offline -pl discovery-server -am

COPY discovery-server/src ./discovery-server/src
RUN mvn clean package -pl discovery-server -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/discovery-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
