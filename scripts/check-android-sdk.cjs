const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка Android SDK...');

const sdkPath = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk');
console.log('SDK Path:', sdkPath);

// Проверяем существование SDK
if (!fs.existsSync(sdkPath)) {
  console.error('❌ Android SDK не найден по пути:', sdkPath);
  console.log('💡 Установите Android Studio или Android SDK');
  process.exit(1);
}

console.log('✅ Android SDK найден');

// Проверяем platform-tools
const platformToolsPath = path.join(sdkPath, 'platform-tools');
if (!fs.existsSync(platformToolsPath)) {
  console.error('❌ platform-tools не найден');
  process.exit(1);
}
console.log('✅ platform-tools найден');

// Проверяем platforms
const platformsPath = path.join(sdkPath, 'platforms');
if (!fs.existsSync(platformsPath)) {
  console.error('❌ platforms не найден');
  process.exit(1);
}

const platforms = fs.readdirSync(platformsPath);
console.log('✅ Platforms:', platforms.join(', '));

// Проверяем build-tools
const buildToolsPath = path.join(sdkPath, 'build-tools');
if (!fs.existsSync(buildToolsPath)) {
  console.error('❌ build-tools не найден');
  process.exit(1);
}

const buildTools = fs.readdirSync(buildToolsPath);
console.log('✅ Build Tools:', buildTools.join(', '));

// Обновляем local.properties
const localPropertiesPath = path.join(__dirname, '..', 'android', 'local.properties');
const localPropertiesContent = `## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
# For customization when using a Version Control System, please read the
# header note.
#Wed Oct 22 12:14:20 MSK 2025
sdk.dir=${sdkPath.replace(/\\/g, '\\\\')}
`;

fs.writeFileSync(localPropertiesPath, localPropertiesContent);
console.log('✅ local.properties обновлен');

console.log('\n🎉 Android SDK настроен правильно!');
console.log('💡 Теперь можете открыть проект в Android Studio');
