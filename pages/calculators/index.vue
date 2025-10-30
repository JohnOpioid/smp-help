<template>
  <div class="flex-1">
    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">

      <div v-for="section in sections" :key="section.title" class="bg-white dark:bg-slate-800 rounded-lg mb-6 last:mb-0">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <p class="text-sm text-slate-600 dark:text-slate-300">{{ section.title }}</p>
        </div>

        <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
          <li
            v-for="(calc, index) in section.items"
            :key="calc.url"
            class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
            :class="{
              'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0) && !(section.items.length % 2 === 1 && index === section.items.length - 1),
              'md:border-b-0': section.items.length % 2 === 0 && index >= section.items.length - 2,
              'border-b-0': index === section.items.length - 1,
              'md:col-span-2': section.items.length % 2 === 1 && index === section.items.length - 1
            }"
            @click="openCalc(calc)"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-slate-900 dark:text-white font-medium">{{ calc.title }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ calc.subtitle }}</p>
              </div>
              <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>

          <li v-if="section.items.length === 0" class="p-6 border-b-0">
            <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Калькуляторы' })

type CalculatorItem = {
  title: string
  subtitle: string
  url: string
}

type CalculatorSection = { title: string, items: CalculatorItem[] }

const sections = ref<CalculatorSection[]>([
        {
          title: 'Сознание',
          items: [
            { title: 'Шкала комы Глазго (GCS)', subtitle: 'Оценка уровня сознания', url: '/calculators/gcs' },
            { title: 'Шкала FOUR', subtitle: 'Глубина комы у интубированных', url: '/calculators/four' },
            { title: 'Шкала RASS', subtitle: 'Возбуждение–седация (реанимация/ИТ)', url: '/calculators/rass' }
          ]
        },
        {
          title: 'Клинические состояния',
          items: [
            { title: 'Шкала ШОКС', subtitle: 'Хроническая сердечная недостаточность', url: '/calculators/shoks' },
            { title: 'Шкала NEWS', subtitle: 'Оценка тяжести состояния при COVID-19', url: '/calculators/news' },
            { title: 'Интенсивность боли', subtitle: 'ВАШ и шкала Вонга–Бейкера', url: '/calculators/pain-vas' },
            { title: 'Шкала LAMS', subtitle: 'Догоспитальная диагностика инсульта', url: '/calculators/lams' },
            { title: 'Шкала оценки вероятности ТЭЛА', subtitle: 'Женевская шкала', url: '/calculators/geneva-pe' },
            { title: 'Калькулятор срока беременности', subtitle: 'Определение предполагаемой даты родов', url: '/calculators/pregnancy-due-date' }
          ]
        },
        {
          title: 'Педиатрические',
          items: [
            { title: 'Физиологические возрастные нормы', subtitle: 'Нормы ЧДД, ЧСС, АД у детей', url: '/calculators/pediatric-norms' },
            { title: 'Детская шкала Глазго', subtitle: 'Оценка сознания у детей до 1 года и 1-4 лет', url: '/calculators/gcs-pediatric' },
            { title: 'Шкала Апгар', subtitle: 'Оценка состояния новорожденного', url: '/calculators/apgar' },
            { title: 'Шкала FLACC', subtitle: 'Оценка боли у детей до 7 лет', url: '/calculators/flacc' },
            { title: 'Шкала Westley Croup', subtitle: 'Оценка тяжести крупа у детей', url: '/calculators/westley-croup' },
            { title: 'Половая формула (Танер)', subtitle: 'Ma/P/Ax/Me для девочек, P/Ax/V для мальчиков', url: '/calculators/sexual-formula' }
          ]
        },
        {
          title: 'Другие',
          items: [
            { title: 'Шкала CIWA-AR', subtitle: 'Тяжесть алкогольного абстинентного синдрома', url: '/calculators/ciwa-ar' },
            { title: 'ШОРС', subtitle: 'Шкала оценки риска суицида', url: '/calculators/shors' },
            { title: 'Площадь ожоговой поверхности (Лунд–Браудер)', subtitle: 'Расчет по возрасту с кликабельными сегментами', url: '/calculators/burn-area' },
            { title: 'Правило «девяток» (TBSA)', subtitle: 'Оценка площади ожогов у взрослых', url: '/calculators/rule-of-nines' }
          ]
        }
])

function openCalc(calc: CalculatorItem) {
  navigateTo(calc.url)
}
</script>



