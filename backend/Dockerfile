# Use Java 17 (Spring Boot compatible)
FROM eclipse-temurin:17-jdk

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Build the app
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Run jar
CMD ["java", "-jar", "target/bookingsystem-0.0.1-SNAPSHOT.jar"]