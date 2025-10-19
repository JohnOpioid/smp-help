<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <AdminSubnav title="Админка" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400">Пользователи</p>
            <p class="text-2xl font-semibold text-slate-900 dark:text-white">
              <USkeleton v-if="pendingStats" class="h-7 w-24" />
              <span v-else>{{ stats.users.total }}</span>
            </p>
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <div v-if="pendingStats">
                <USkeleton class="h-4 w-40" />
              </div>
              <div v-else>
                <span v-for="r in stats.users.byRole" :key="r.role" class="inline-block me-3">
                  {{ r.role }}: <span class="font-medium">{{ r.count }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400">Подстанции</p>
            <p class="text-2xl font-semibold text-slate-900 dark:text-white">
              <USkeleton v-if="pendingStats" class="h-7 w-24" />
              <span v-else>{{ (stats as any).substations?.total || 0 }}</span>
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400">Кодификатор</p>
            <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <div class="flex items-center gap-6">
                <div>
                  <p class="text-xs text-slate-500">Категории</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ (stats as any).codifier?.categories || 0 }}</span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Диагнозы (МКБ)</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ (stats as any).codifier?.mkb || 0 }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400">Локальные статусы</p>
            <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <div class="flex items-center gap-6">
                <div>
                  <p class="text-xs text-slate-500">Категории</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ (stats as any).localStatuses?.categories || 0 }}</span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Статусы</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ (stats as any).localStatuses?.items || 0 }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400">Инструкции</p>
            <p class="text-2xl font-semibold text-slate-900 dark:text-white">
              <USkeleton v-if="pendingStats" class="h-7 w-24" />
              <span v-else>{{ stats.instructions.total }}</span>
            </p>
          </div>
        </div>

        <!-- Топ подстанций по количеству пользователей -->
        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg mt-6">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Пользователи по подстанциям (топ-10)</h3>
          </div>
          <div class="p-4">
            <UTable :rows="topSubstationsRows" :columns="topSubstationsCols" :loading="pendingStats" />
          </div>
        </div>
      </div>
    </main>
  </div>

</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { data: statsRes, pending: pendingStats } = await useFetch('/api/admin/stats')
const stats = computed(() => statsRes.value?.stats || {
  users: { total: 0, byRole: [], bySubstation: [], topSubstations: [] },
  substations: { total: 0 },
  codifier: { categories: 0, mkb: 0 },
  localStatuses: { categories: 0, items: 0 },
  instructions: { total: 0 }
})

const topSubstationsCols = [
  { accessorKey: 'substation', header: 'Подстанция' },
  { accessorKey: 'count', header: 'Пользователей' }
]
const topSubstationsRows = computed(() => stats.value.users.topSubstations || [])
</script>
