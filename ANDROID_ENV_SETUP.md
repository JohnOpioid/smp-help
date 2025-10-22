# Настройка переменных окружения для Android разработки

## Установите следующие переменные окружения:

### JAVA_HOME
```
C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot
```

### ANDROID_HOME
```
C:\Users\Home\AppData\Local\Android\Sdk
```

### Добавьте в PATH:
```
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

## Как установить переменные окружения:

### Через PowerShell (временные):
```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot"
$env:ANDROID_HOME = "C:\Users\Home\AppData\Local\Android\Sdk"
$env:PATH += ";$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools"
```

### Через системные настройки (постоянные):
1. Откройте "Параметры системы" → "Дополнительные параметры системы"
2. Нажмите "Переменные среды"
3. В разделе "Переменные пользователя" добавьте:
   - JAVA_HOME = `C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot`
   - ANDROID_HOME = `C:\Users\Home\AppData\Local\Android\Sdk`
4. В PATH добавьте:
   - `%JAVA_HOME%\bin`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

## Проверка установки:
```powershell
java -version
adb version
```

После настройки перезапустите Android Studio и попробуйте снова запустить приложение.
