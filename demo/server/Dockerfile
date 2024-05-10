FROM openjdk:23-ea-17-oraclelinux9
VOLUME /tmp
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]