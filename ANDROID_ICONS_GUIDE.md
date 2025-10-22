# 📱 Руководство по иконкам для Android приложения

## 🎯 Обзор

Для Android приложения нужны иконки в двух категориях:
1. **Иконка приложения** (launcher icon) - отображается на рабочем столе
2. **Splash screen** (заглушка) - показывается при запуске приложения

## 📐 Форматы и размеры иконок

### 1. Иконка приложения (Launcher Icon)

#### Адаптивные иконки (Android 8.0+)
- **Формат**: PNG
- **Размеры**: 
  - `mipmap-mdpi/`: 48x48px
  - `mipmap-hdpi/`: 72x72px  
  - `mipmap-xhdpi/`: 96x96px
  - `mipmap-xxhdpi/`: 144x144px
  - `mipmap-xxxhdpi/`: 192x192px

#### Компоненты адаптивной иконки:
- **Foreground** (`ic_launcher_foreground.png`) - основная иконка
- **Background** (`ic_launcher_background.xml`) - фон (цвет или градиент)
- **Round icon** (`ic_launcher_round.png`) - для круглых лаунчеров

### 2. Splash Screen (Заглушка)

#### Форматы и размеры:
- **Портретная ориентация**:
  - `drawable-port-mdpi/`: 320x480px
  - `drawable-port-hdpi/`: 480x800px
  - `drawable-port-xhdpi/`: 720x1280px
  - `drawable-port-xxhdpi/`: 1080x1920px
  - `drawable-port-xxxhdpi/`: 1440x2560px

- **Альбомная ориентация**:
  - `drawable-land-mdpi/`: 480x320px
  - `drawable-land-hdpi/`: 800x480px
  - `drawable-land-xhdpi/`: 1280x720px
  - `drawable-land-xxhdpi/`: 1920x1080px
  - `drawable-land-xxxhdpi/`: 2560x1440px

## 🎨 Требования к дизайну

### Иконка приложения:
- **Стиль**: Плоский дизайн, минимализм
- **Цвета**: Соответствовать бренду (медицинская тематика)
- **Элементы**: Медицинский крест, стетоскоп, или абстрактный символ помощи
- **Контраст**: Хорошо читаться на любом фоне
- **Безопасная зона**: Важные элементы в центре (66% от общей площади)

### Splash Screen:
- **Стиль**: Простой, чистый дизайн
- **Элементы**: Логотип + название приложения
- **Цвета**: Светлый фон, темный текст (или наоборот)
- **Анимация**: Опционально - плавное появление логотипа

## 📁 Структура файлов

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   ├── ic_launcher_foreground.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   ├── ic_launcher_foreground.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   ├── ic_launcher_foreground.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   ├── ic_launcher_foreground.png (144x144)
│   └── ic_launcher_round.png (144x144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png (192x192)
│   ├── ic_launcher_foreground.png (192x192)
│   └── ic_launcher_round.png (192x192)
├── drawable-port-mdpi/
│   └── splash.png (320x480)
├── drawable-port-hdpi/
│   └── splash.png (480x800)
├── drawable-port-xhdpi/
│   └── splash.png (720x1280)
├── drawable-port-xxhdpi/
│   └── splash.png (1080x1920)
├── drawable-port-xxxhdpi/
│   └── splash.png (1440x2560)
├── drawable-land-mdpi/
│   └── splash.png (480x320)
├── drawable-land-hdpi/
│   └── splash.png (800x480)
├── drawable-land-xhdpi/
│   └── splash.png (1280x720)
├── drawable-land-xxhdpi/
│   └── splash.png (1920x1080)
├── drawable-land-xxxhdpi/
│   └── splash.png (2560x1440)
└── values/
    └── ic_launcher_background.xml (цвет фона)
```

## 🛠️ Инструменты для создания

### Онлайн генераторы:
1. **Android Asset Studio** (https://romannurik.github.io/AndroidAssetStudio/)
2. **App Icon Generator** (https://appicon.co/)
3. **Icon Kitchen** (https://icon.kitchen/)

### Рекомендуемые программы:
1. **Figma** - для дизайна
2. **Adobe Illustrator** - для векторной графики
3. **GIMP** - бесплатный редактор
4. **Canva** - простой онлайн редактор

## 📋 Пошаговая инструкция

### 1. Создание иконки приложения:
1. Создайте основную иконку 512x512px
2. Экспортируйте в PNG для каждого размера
3. Поместите файлы в соответствующие папки mipmap-*

### 2. Создание splash screen:
1. Создайте дизайн 1080x1920px (портрет)
2. Экспортируйте для каждого размера и ориентации
3. Поместите файлы в папки drawable-port-* и drawable-land-*

### 3. Обновление конфигурации:
1. Обновите `ic_launcher_background.xml` с нужным цветом
2. Проверьте `ic_launcher.xml` и `ic_launcher_round.xml`
3. Пересоберите приложение

## 🎨 Примеры дизайна

### Для медицинского приложения:
- **Иконка**: Белый медицинский крест на синем/зеленом фоне
- **Splash**: Логотип + "Справочник СМП" + подзаголовок
- **Цвета**: #26A69A (teal), #FFFFFF (белый), #000000 (черный)

### Альтернативные варианты:
- Стетоскоп как основная иконка
- Абстрактный символ помощи (рука + сердце)
- Минималистичный крест с градиентом

## ⚠️ Важные замечания

1. **Качество**: Используйте векторную графику для лучшего качества
2. **Тестирование**: Проверьте иконки на разных устройствах
3. **Консистентность**: Иконка должна соответствовать бренду
4. **Производительность**: Оптимизируйте размеры файлов
5. **Доступность**: Убедитесь в хорошем контрасте

## 🔄 Обновление иконок

После создания новых иконок:
1. Замените файлы в соответствующих папках
2. Выполните `npm run cap:sync`
3. Пересоберите APK: `npm run cap:build:production`
4. Протестируйте на устройстве
