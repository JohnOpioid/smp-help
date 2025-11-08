<template>
  <div class="w-full" :style="{ minHeight: `${chartHeight}px` }">
    <apexchart
      ref="chartRef"
      type="line"
      :options="chartOptions"
      :series="series"
      :height="chartHeight"
      class="w-full"
      @mounted="onChartMounted"
      @updated="onChartUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  data: Array<{ date: string; count?: number; loggedIn?: number; guests?: number; total?: number }>
  color?: string
  height?: number | string
  multipleSeries?: boolean
  seriesColors?: string[]
  seriesNames?: string[]
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const chartRef = ref<any>(null)

const height = computed(() => props.height || 300)

const chartHeight = computed(() => {
  // Для адаптивности используем фиксированную высоту, но контейнер будет адаптивным
  if (props.height === 'auto') {
    return 300 // ApexCharts требует числовое значение
  }
  return typeof height.value === 'number' ? height.value : 300
})

const color = computed(() => props.color || '#3b82f6')

const series = computed(() => {
  if (props.multipleSeries && props.data && props.data.length > 0) {
    // Множественные серии (например, залогиненные и гости)
    const seriesList = []
    
    if (props.seriesNames && props.seriesNames.length > 0) {
      props.seriesNames.forEach((name, index) => {
        let dataKey = 'count'
        if (index === 0) dataKey = 'loggedIn'
        else if (index === 1) dataKey = 'guests'
        else if (index === 2) dataKey = 'total'
        
        seriesList.push({
          name: name,
          data: props.data.map(item => ({
            x: new Date(item.date).getTime(),
            y: item[dataKey as keyof typeof item] as number || 0
          }))
        })
      })
    } else {
      // По умолчанию: залогиненные и гости
      seriesList.push(
        {
          name: 'Залогиненные',
          data: props.data.map(item => ({
            x: new Date(item.date).getTime(),
            y: item.loggedIn || 0
          }))
        },
        {
          name: 'Гости',
          data: props.data.map(item => ({
            x: new Date(item.date).getTime(),
            y: item.guests || 0
          }))
        }
      )
    }
    
    return seriesList
  }
  
  // Одна серия (старый формат)
  return [{
    name: 'Количество',
    data: props.data?.map(item => ({
      x: new Date(item.date).getTime(),
      y: item.count || 0
    })) || []
  }]
})

const initialZoomRange = computed(() => {
  if (!props.data || props.data.length === 0) return undefined
  const totalDays = props.data.length
  if (totalDays <= 7) return undefined
  const startIndex = Math.max(0, totalDays - 7)
  return { start: startIndex, end: totalDays - 1 }
})

const xaxisMin = computed(() => {
  if (!initialZoomRange.value || !props.data) return undefined
  const startDate = new Date(props.data[initialZoomRange.value.start].date)
  startDate.setHours(0, 0, 0, 0)
  return startDate.getTime()
})

const xaxisMax = computed(() => {
  if (!initialZoomRange.value || !props.data) return undefined
  const endDate = new Date(props.data[initialZoomRange.value.end].date)
  endDate.setHours(23, 59, 59, 999)
  return endDate.getTime()
})

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: chartHeight.value,
    toolbar: {
      show: false
    },
    zoom: {
      enabled: true,
      type: 'x',
      autoSelected: 'x'
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    },
    events: {
      mounted: (chartContext: any) => {
        // Устанавливаем зум после полной инициализации
        if (xaxisMin.value && xaxisMax.value) {
          setTimeout(() => {
            try {
              chartContext.zoomX(xaxisMin.value, xaxisMax.value)
            } catch (error) {
              console.warn('Не удалось установить зум:', error)
            }
          }, 300)
        }
      }
    }
  },
  colors: props.multipleSeries && props.seriesColors 
    ? props.seriesColors 
    : props.multipleSeries 
      ? ['#3b82f6', '#10b981', '#8b5cf6'] 
      : [color.value],
  stroke: {
    curve: 'smooth',
    width: 2
  },
  markers: {
    size: 4,
    hover: {
      size: 6
    }
  },
  grid: {
    borderColor: isDark.value ? '#334155' : '#e2e8f0',
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      style: {
        colors: isDark.value ? '#94a3b8' : '#64748b',
        fontSize: '12px'
      },
      rotate: -45,
      rotateAlways: false,
      datetimeUTC: false,
      format: 'dd.MM'
    },
    axisBorder: {
      color: isDark.value ? '#334155' : '#e2e8f0'
    },
    axisTicks: {
      color: isDark.value ? '#334155' : '#e2e8f0'
    },
    // Устанавливаем начальный диапазон для показа последней недели
    min: xaxisMin.value,
    max: xaxisMax.value
  },
  yaxis: {
    labels: {
      style: {
        colors: isDark.value ? '#94a3b8' : '#64748b',
        fontSize: '12px'
      }
    }
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    x: {
      format: 'dd.MM.yyyy'
    },
    y: {
      formatter: (value: number, { seriesIndex, w }: any) => {
        if (props.multipleSeries && w?.globals?.seriesNames) {
          const seriesName = w.globals.seriesNames[seriesIndex] || ''
          return `${seriesName}: ${value} ${value === 1 ? 'пользователь' : value < 5 ? 'пользователя' : 'пользователей'}`
        }
        return `${value} ${value === 1 ? 'пользователь' : value < 5 ? 'пользователя' : 'пользователей'}`
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  legend: {
    show: props.multipleSeries || false,
    position: 'top',
    horizontalAlign: 'right',
    labels: {
      colors: isDark.value ? '#94a3b8' : '#64748b'
    }
  }
}))

// Для datetime оси зум устанавливается через min/max в опциях, поэтому функции не нужны
function onChartMounted() {
  // График уже настроен через опции
}

function onChartUpdated() {
  // График обновится автоматически через реактивные опции
}
</script>

