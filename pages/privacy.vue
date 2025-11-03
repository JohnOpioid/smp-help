<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Политика конфиденциальности</h1>
    
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div class="space-y-6">
          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Общие положения</h2>
            <p class="text-slate-600 dark:text-slate-300">
              Настоящая Политика конфиденциальности определяет порядок обработки персональных данных 
              пользователей сайта "Справочник СМП" (далее — "Сайт"). Используя Сайт, вы соглашаетесь 
              с условиями данной Политики.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Собираемые данные</h2>
            <div class="space-y-3">
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Персональные данные:</h3>
                <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 ml-4">
                  <li>Имя и фамилия</li>
                  <li>Email адрес</li>
                  <li>Город и подстанция</li>
                  <li>Пароль (в зашифрованном виде)</li>
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Технические данные:</h3>
                <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 ml-4">
                  <li>IP-адрес</li>
                  <li>Информация о браузере</li>
                  <li>Время посещения страниц</li>
                  <li>История поисковых запросов</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Цели обработки данных</h2>
            <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              <li>Предоставление доступа к справочным материалам</li>
              <li>Персонализация контента и рекомендаций</li>
              <li>Улучшение функциональности сайта</li>
              <li>Обеспечение безопасности и предотвращение мошенничества</li>
              <li>Соблюдение правовых требований</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Передача данных третьим лицам</h2>
            <p class="text-slate-600 dark:text-slate-300">
              Мы не передаем ваши персональные данные третьим лицам, за исключением случаев, 
              когда это необходимо для предоставления услуг или требуется законодательством. 
              Данные могут передаваться только с вашего явного согласия.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Безопасность данных</h2>
            <p class="text-slate-600 dark:text-slate-300">
              Мы применяем современные технические и организационные меры для защиты ваших 
              персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Ваши права</h2>
            <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              <li>Право на доступ к своим персональным данным</li>
              <li>Право на исправление неточных данных</li>
              <li>Право на удаление данных</li>
              <li>Право на ограничение обработки</li>
              <li>Право на портируемость данных</li>
              <li>Право на возражение против обработки</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">7. Контактная информация</h2>
            <p class="text-slate-600 dark:text-slate-300">
              По вопросам обработки персональных данных обращайтесь по адресу: 
              <a href="mailto:message@johnone.ru" class="text-indigo-600 hover:text-indigo-700">message@johnone.ru</a>
            </p>
          </section>

          <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mt-6">
            <p class="text-sm text-slate-600 dark:text-slate-300">
              <strong>Дата последнего обновления:</strong> {{ currentDate }}
            </p>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Текущая дата для отображения
const currentDate = new Date().toLocaleDateString('ru-RU')

// Мета-информация для страницы
useHead({
  title: 'Политика конфиденциальности - Справочник СМП',
  meta: [
    { name: 'description', content: 'Политика конфиденциальности и обработки персональных данных Справочника СМП' }
  ]
})

// Заголовок для хедера
definePageMeta({
  headerTitle: 'Политика конфиденциальности',
  middleware: 'auth'
})
</script>
