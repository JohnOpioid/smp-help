const fs = require('fs');
const path = require('path');

// Создаем gradle wrapper файлы
const gradleWrapperDir = path.join(__dirname, '..', 'android', 'gradle', 'wrapper');

// Создаем директорию если не существует
if (!fs.existsSync(gradleWrapperDir)) {
  fs.mkdirSync(gradleWrapperDir, { recursive: true });
}

// Создаем gradle-wrapper.properties
const gradleWrapperPropertiesContent = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

const gradleWrapperProperties = path.join(gradleWrapperDir, 'gradle-wrapper.properties');
fs.writeFileSync(gradleWrapperProperties, gradleWrapperPropertiesContent);

// Создаем простой gradlew.bat
const gradlewBat = path.join(__dirname, '..', 'android', 'gradlew.bat');
const gradlewBatContent = `@echo off
set JAVA_HOME=%JAVA_HOME%
if "%JAVA_HOME%"=="" set JAVA_HOME=C:\\Program Files\\Java\\jdk-17
"%JAVA_HOME%\\bin\\java.exe" -jar gradle\\wrapper\\gradle-wrapper.jar %*
`;

fs.writeFileSync(gradlewBat, gradlewBatContent);

console.log('Gradle wrapper восстановлен!');
