<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] p-2 sm:p-4">
    <!-- Оверлей -->
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closePanel"></div>

    <!-- Bottom sheet панель -->
    <Transition name="bsp-slide">
      <div ref="panelRef"
        class="relative z-10 h-[calc(100dvh-1rem)] h-[calc(100vh-1rem)] sm:h-[calc(100dvh-2rem)] sm:h-[calc(100vh-2rem)] max-w-5xl w-full mx-auto flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 translate-y-0 will-change-transform"
        :class="{ 'transition-transform duration-300 ease-out': !isDragging }"
        :style="{ transform: 'translateY(' + panelOffsetY + 'px)' }">

        <!-- Заголовок с хэндлом и переключателем ИИ -->
        <div ref="headerRef"
          class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-grab active:cursor-grabbing"
          @touchstart="onDragStart" @touchmove="onDragMove" @touchend="onDragEnd" @mousedown="onDragStart"
          @mousemove="onDragMove" @mouseup="onDragEnd" @mouseleave="onDragEnd">
          <div class="flex items-center justify-center select-none py-2">
            <div class="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
          </div>
          <div class="max-w-5xl mx-auto px-4 py-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5">
                  <span class="text-sm text-slate-600 dark:text-slate-300">Амби</span>
                  <USwitch :model-value="aiEnabled" @update:model-value="val => aiEnabled = val" size="sm" color="neutral" class="cursor-pointer" />
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ aiEnabled ? 'включен' : 'выключен' }}</span>
                </div>
              </div>

              <button v-if="chatMessages.length > 0" @click="clearChatHistory" @touchstart="clearChatHistory"
                class="p-3 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-lg transition-colors cursor-pointer touch-manipulation select-none"
                title="Очистить историю чата">
                <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Контент -->
        <div class="flex-1 overflow-y-auto panel-scroll" ref="contentContainer" @scroll="onPanelScroll">
          <div v-if="isPreloading" class="sticky top-0 z-20">
            <div class="h-1 w-full bg-transparent">
              <div class="h-1 bg-indigo-600 animate-pulse" style="width: 100%"></div>
            </div>
          </div>

          <!-- Чат -->
          <div class="max-w-5xl mx-auto px-4 py-6">
            <div class="space-y-4">
              <!-- Приветствие -->
              <div v-if="chatMessages.length === 0" class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="aiEnabled ? 'bg-indigo-600 overflow-hidden' : 'bg-slate-600'">
                  <img v-if="aiEnabled" src="/assets/img/AI-avatar.png" alt="AI" class="w-8 h-8 object-cover" />
                  <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div class="flex flex-col gap-2 max-w-2xl">
                  <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    <p class="text-slate-900 dark:text-white mb-2" v-if="aiEnabled">
                      Привет! Я <strong>Амби</strong> — ваш помощник в работе скорой медицинской помощи. Подскажу диагнозы по МКБ,
                      помогу подобрать препараты (с дозировками и аналогами), дам короткие пошаговые
                      инструкции и алгоритмы, а также найду ближайшие подстанции. Опишите задачу обычными
                      словами — я подберу точные материалы из базы и предложу быстрые действия.
                    </p>
                    <p class="text-slate-900 dark:text-white mb-2" v-else>
                      Привет! Это обычный поиск по базе сайта без ИИ. Я найду диагнозы, локальные статусы,
                      алгоритмы, инструкции, препараты и подстанции по вашему запросу. Введите ключевые
                      слова (например, диагноз или препарат) — покажу подходящие результаты из базы.
                    </p>
                  </div>
                  <div v-if="aiEnabled" class="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button @click="sendQuickMessage('Покажи диагнозы по коду МКБ')"
                      class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                      <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-slate-500 mr-1.5" /> Диагнозах МКБ
                    </button>
                    <button @click="sendQuickMessage('Найди препарат для лечения')"
                      class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                      <UIcon name="i-lucide-pill" class="w-4 h-4 text-slate-500 mr-1.5" /> Препаратах
                    </button>
                    <button @click="sendQuickMessage('Покажи инструкции по процедурам')"
                      class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                      <UIcon name="i-lucide-book-open" class="w-4 h-4 text-slate-500 mr-1.5" /> Инструкциях
                    </button>
                    <button @click="sendQuickMessage('Где находится ближайшая подстанция?')"
                      class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                      <UIcon name="i-lucide-building-2" class="w-4 h-4 text-slate-500 mr-1.5" /> Подстанциях
                    </button>
                  </div>
                </div>
              </div>

              <!-- Сообщения чата -->
              <div v-for="message in chatMessages" :key="message.id" class="flex items-start gap-3" :class="message.isUser ? 'flex-row-reverse' : ''">
                <!-- Аватар -->
                <div v-if="!message.isUser"
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 sticky top-1 self-start z-10 overflow-hidden"
                  :class="message.confirmClear ? 'bg-amber-500' : (message.isAI || (message.isLoading && aiEnabled)) ? 'bg-indigo-600' : 'bg-slate-600'">
                  <svg v-if="message.confirmClear" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                  <img v-else-if="message.isAI || (message.isLoading && aiEnabled)" src="/assets/img/AI-avatar.png" alt="AI" class="w-8 h-8 object-cover" />
                  <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <div v-else class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-semibold select-none sticky top-1 self-start z-10">
                  {{ userInitials }}
                </div>

                <!-- Контент сообщения -->
                <div class="max-w-2xl">
                  <UContextMenu :items="getContextMenuItems(message)">
                    <div class="rounded-lg p-2" :class="message.isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'">
                      <div v-if="!message.isUser && (message.isAI || (message.isLoading && aiEnabled)) && !message.confirmClear" class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Милена</div>

                      <div v-if="message.isLoading" class="flex items-center gap-3">
                        <div class="flex space-x-1">
                          <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                          <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                          <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                        <span class="text-slate-600 dark:text-slate-300">{{ message.text }}</span>
                      </div>

                      <div v-else>
                        <!-- Режим редактирования -->
                        <div v-if="editingMessageId === message.id" class="space-y-3">
                          <textarea v-model="editingText" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none" rows="3" @keydown.enter.ctrl="saveEditMessage" @keydown.escape="cancelEditMessage"></textarea>
                          <div class="flex gap-2 justify-end">
                            <button @click="cancelEditMessage" class="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-1000 transition-colors">Отмена</button>
                            <button @click="saveEditMessage" class="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Сохранить</button>
                          </div>
                        </div>

                        <!-- Обычный режим -->
                        <div v-else>
                          <div class="max-w-none text-slate-900 dark:text-white leading-relaxed" :class="message.isUser ? 'text-white' : ''" v-html="renderMarkdown(message.text)"></div>

                          

                          <!-- Секции результатов (МКБ / ЛС / Алгоритмы) -->
                          <div v-if="message.results && message.results.length > 0 && (!message.isAI || isDetailsShown(message.id))" class="mt-4 space-y-4">
                            <!-- Диагнозы МКБ -->
                            <template v-if="getSectionAll(message, 'mkb').length && (!(message as any).intent || (message as any).intent === 'mkb')">
                              <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Диагнозы МКБ</div>
                              <div class="space-y-3">
                                <div v-for="result in getSectionVisible(message, 'mkb')" :key="result.id" class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                                  <div class="p-3">
                                    <div class="flex items-start justify-between">
                                      <div class="flex-1">
                                        <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                                        <p v-if="(result.description || result.data?.note || result.data?.description)" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                          {{ truncateToApproximateLines(result.description || result.data?.note || result.data?.description, 5) }}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <!-- Разделитель между шапкой и футером -->
                                  <div class="border-t border-slate-100 dark:border-slate-600"></div>
                                  <!-- Контентная часть с бейджами и заметками -->
                                  <div class="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                                      <span v-if="result.codes?.mkbCode" class="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">МКБ: {{ result.codes?.mkbCode }}</span>
                                      <span v-if="result.codes?.stationCode" class="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs font-mono text-green-700 dark:text-green-300">Станция: {{ result.codes?.stationCode }}</span>
                                      <span v-if="result.category" class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">{{ result.category }}</span>
                                    </div>
                                    <div v-if="result.data?.note" class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{{ result.data.note }}</div>
                                  </div>
                                  <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                                    <div class="flex flex-wrap gap-1 pt-2">
                                      <button @click="openMkbModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-clipboard-list" class="w-3 h-3" />Открыть
                                      </button>
                                      <button @click="copyToClipboard(result.title + ': ' + result.description)" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="getSectionAll(message, 'mkb').length > 3" class="px-4 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                <button type="button" @click="toggleSection(message.id, 'mkb')" class="rounded-md font-medium inline-flex items-center transition-colors px-2.5 py-1.5 text-sm gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                  <UIcon :name="isExpandedSection(message.id, 'mkb') ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'" class="me-1 w-4 h-4" />
                                  {{ isExpandedSection(message.id, 'mkb') ? 'Скрыть' : `Показать все (${getSectionAll(message, 'mkb').length})` }}
                                </button>
                              </div>
                            </template>

                            <!-- Локальные статусы -->
                            <template v-if="getSectionAll(message, 'ls').length && (!(message as any).intent || (message as any).intent === 'ls')">
                              <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Локальные статусы</div>
                              <div class="space-y-3">
                                <div v-for="result in getSectionVisible(message, 'ls')" :key="result.id" class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                                  <div class="p-3">
                                    <div class="flex items-start justify-between">
                                      <div class="flex-1">
                                        <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                                        <p v-if="(result.description || result.data?.description || result.data?.note)" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                          {{ truncateToApproximateLines(result.description || result.data?.description || result.data?.note, 5) }}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <!-- Описание локального статуса (localis) -->
                                  <div v-if="result.localis" class="px-3 py-2 border-t border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-700">
                                    <div class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ truncateToApproximateLines(result.localis, 5) }}</div>
                                  </div>
                                  <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                                    <div class="flex flex-wrap gap-1 pt-2">
                                      <button @click="openLocalStatusModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-tag" class="w-3 h-3" />Открыть
                                      </button>
                                      <button @click="copyToClipboard(result.title + ': ' + result.description)" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="getSectionAll(message, 'ls').length > 3" class="px-4 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                <button type="button" @click="toggleSection(message.id, 'ls')" class="rounded-md font-medium inline-flex items-center transition-colors px-2.5 py-1.5 text-sm gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                  <UIcon :name="isExpandedSection(message.id, 'ls') ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'" class="me-1 w-4 h-4" />
                                  {{ isExpandedSection(message.id, 'ls') ? 'Скрыть' : `Показать все (${getSectionAll(message, 'ls').length})` }}
                                </button>
                              </div>
                            </template>

                            <!-- Алгоритмы -->
                            <template v-if="getSectionAll(message, 'algo').length && (!(message as any).intent || (message as any).intent === 'algorithm' || (message as any).intent === 'mkb')">
                              <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Алгоритмы</div>
                              <div class="space-y-3">
                                <div v-for="result in getSectionVisible(message, 'algo')" :key="result.id" class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                                  <div class="p-3">
                                    <div class="flex items-start justify-between">
                                      <div class="flex-1">
                                        <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                                        <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">{{ result.description }}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <!-- Разделитель между шапкой и футером -->
                                  <div class="border-t border-slate-100 dark:border-slate-600"></div>
             <!-- Контентная часть с таблицей алгоритма -->
             <div class="bg-slate-50/50 dark:bg-slate-800/30">
               <div v-if="result.data?.content" class="relative">
                 <div :class="isTableExpanded(result.id) ? 'max-h-none' : 'max-h-32 overflow-hidden'">
                   <!-- Обертка таблицы с внешним border'ом как на странице алгоритма -->
                   <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-none md:rounded-lg overflow-x-hidden relative sticky-container" data-styled-table-wrapper>
                     <div v-html="renderAlgorithmTable(result.data.content)" class="text-xs sm:text-sm" @vue:mounted="setupMobileTableLogic"></div>
                   </div>
                 </div>
                 <!-- Градиент для визуального эффекта исчезновения (только когда таблица свернута) -->
                 <div v-if="!isTableExpanded(result.id)" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent pointer-events-none"></div>
                 <!-- Кнопка раскрытия/скрытия -->
                 <div class="flex justify-center py-2">
                   <button @click="toggleTable(result.id)" class="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs hover:bg-slate-300 dark:hover:bg-slate-1000 transition-colors border-0 cursor-pointer">
                     <UIcon :name="isTableExpanded(result.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
                     {{ isTableExpanded(result.id) ? 'Скрыть' : 'Показать полностью' }}
                   </button>
                 </div>
               </div>
             </div>
                                  <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                                    <div class="flex flex-wrap gap-1 pt-2">
                                      <button @click="openAlgorithmModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-list-tree" class="w-3 h-3" />Открыть
                                      </button>
                                      <button @click="copyToClipboard(result.title + ': ' + result.description)" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="getSectionAll(message, 'algo').length > 3" class="px-4 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                <button type="button" @click="toggleSection(message.id, 'algo')" class="rounded-md font-medium inline-flex items-center transition-colors px-2.5 py-1.5 text-sm gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                  <UIcon :name="isExpandedSection(message.id, 'algo') ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'" class="me-1 w-4 h-4" />
                                  {{ isExpandedSection(message.id, 'algo') ? 'Скрыть' : `Показать все (${getSectionAll(message, 'algo').length})` }}
                                </button>
                              </div>
                            </template>

                            <!-- Препараты -->
                            <template v-if="getSectionAll(message, 'drug').length && (!(message as any).intent || (message as any).intent === 'drug' || (message as any).intent === 'mkb')">
                              <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Препараты</div>
                              <div class="space-y-3">
                                <div v-for="result in getSectionVisible(message, 'drug')" :key="result.id" class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                                  <div class="p-3">
                                    <div class="flex items-start justify-between">
                                      <div class="flex-1">
                                        <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                                        <p v-if="result.data?.latinName" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ result.data.latinName }}</p>
                                        <p v-if="result.dosage" class="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">{{ result.dosage }}</p>
                                        <p v-if="result.data?.synonyms && result.data.synonyms.length > 0" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                          <span class="font-medium">Синонимы:</span> {{ result.data.synonyms.join(', ') }}
                                        </p>
                                        <p v-if="result.description && result.description !== result.data?.latinName" class="text-sm text-slate-600 dark:text-slate-300 mt-1">{{ result.description }}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                                    <div class="flex flex-wrap gap-1 pt-2">
                                      <button @click="openDrugModal(result.data)" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-heroicons:eye" class="w-3 h-3" />Подробнее
                                      </button>
                                      <button @click="addDrugBookmark(result.data)" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-heroicons:bookmark" class="w-3 h-3" />В закладки
                                      </button>
                                      <button @click="copyToClipboard(result.title + ': ' + result.description)" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="getSectionAll(message, 'drug').length > 3" class="px-4 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                <button type="button" @click="toggleSection(message.id, 'drug')" class="rounded-md font-medium inline-flex items-center transition-colors px-2.5 py-1.5 text-sm gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                  <UIcon :name="isExpandedSection(message.id, 'drug') ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'" class="me-1 w-4 h-4" />
                                  {{ isExpandedSection(message.id, 'drug') ? 'Скрыть' : `Показать все (${getSectionAll(message, 'drug').length})` }}
                                </button>
                              </div>
                            </template>

                            <!-- Подстанции -->
                            <template v-if="getSectionAll(message, 'substation').length && (!(message as any).intent || (message as any).intent === 'substation')">
                              <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Подстанции</div>
                              <div class="space-y-3">
                                <div v-for="result in getSectionVisible(message, 'substation')" :key="result.id" class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                                  <div class="p-3">
                                    <div class="flex items-start justify-between">
                                      <div class="flex-1">
                                        <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                                        <p v-if="result.data?.address" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ result.data.address }}</p>
                                        <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">{{ result.description }}</p>
                                        
                                        <!-- Кнопки для телефонов -->
                                        <div v-if="result.data?.phones" class="flex flex-wrap gap-2 mt-3">
                                          <button 
                                            v-for="(phone, index) in getPhoneArray(result.data.phones)" 
                                            :key="index"
                                            @click="callPhone(phone)"
                                            class="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors cursor-pointer"
                                          >
                                            <UIcon name="i-lucide-phone" class="w-3 h-3 mr-1" />{{ phone }}
                                          </button>
                                        </div>
                                        
                                        <!-- Карта подстанции -->
                                        <div v-if="result.data?.coordinates && Array.isArray(result.data.coordinates) && result.data.coordinates.length === 2" class="mt-3">
                                          <div class="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                                            <div class="h-32 w-full">
                                              <YMap 
                                                :center="result.data.coordinates"
                                                :zoom="15"
                                                :placemarks="[{
                                                  id: result.id,
                                                  coords: result.data.coordinates,
                                                  hint: result.title,
                                                  balloon: `${result.title}<br/>${result.data.address || ''}`
                                                }]"
                                                class="rounded-lg"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <!-- Отладочная информация -->
                                        <div v-if="!result.data?.coordinates || !Array.isArray(result.data.coordinates) || result.data.coordinates.length !== 2" class="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs text-yellow-700 dark:text-yellow-300">
                                          🗺️ Карта недоступна. 
                                          <br/>Координаты: {{ result.data?.coordinates ? JSON.stringify(result.data.coordinates) : 'не найдены' }}
                                          <br/>Тип: {{ typeof result.data?.coordinates }}
                                          <br/>Массив: {{ Array.isArray(result.data?.coordinates) ? 'да' : 'нет' }}
                                          <br/>Длина: {{ Array.isArray(result.data?.coordinates) ? result.data.coordinates.length : 'N/A' }}
                                          <br/><strong>Поле location:</strong> {{ JSON.stringify(result.data?.location) }}
                                          <br/><strong>Все поля подстанции:</strong>
                                          <br/>{{ JSON.stringify(result.data, null, 2) }}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                                    <div class="flex flex-wrap gap-1 pt-2">
                                      <button @click="openSubstationOnMap(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-map-pin" class="w-3 h-3" />На карте
                                      </button>
                                      <button @click="copyToClipboard(result.title + ': ' + result.description)" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                                        <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="getSectionAll(message, 'substation').length > 3" class="px-4 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                <button type="button" @click="toggleSection(message.id, 'substation')" class="rounded-md font-medium inline-flex items-center transition-colors px-2.5 py-1.5 text-sm gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                  <UIcon :name="isExpandedSection(message.id, 'substation') ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'" class="me-1 w-4 h-4" />
                                  {{ isExpandedSection(message.id, 'substation') ? 'Скрыть' : `Показать все (${getSectionAll(message, 'substation').length})` }}
                                </button>
                              </div>
                            </template>
                          </div>

                          <!-- Время и оценка -->
                          <div v-if="!message.confirmClear" class="flex items-center justify-between mt-1">
                            <div class="text-xs text-slate-400">{{ formatTime(message.timestamp) }}</div>
                            <div v-if="!message.isUser && !message.isLoading" class="flex items-center gap-2">
                              <button @click="rateBotResponse(message, 'positive')" :class="[
                                'w-8 h-8 rounded-full transition-colors text-xs flex items-center justify-center cursor-pointer',
                                message.userRating === 'positive'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : message.userRating === 'negative'
                                    ? 'opacity-30'
                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              ]" :disabled="!!message.userRating" title="Хороший ответ">
                                <UIcon name="i-lucide-thumbs-up" class="w-4 h-4" />
                              </button>
                              <button @click="rateBotResponse(message, 'negative')" :class="[
                                'w-8 h-8 rounded-full transition-colors text-xs flex items-center justify-center cursor-pointer',
                                message.userRating === 'negative'
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                                  : message.userRating === 'positive'
                                    ? 'opacity-30'
                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              ]" :disabled="!!message.userRating" title="Плохой ответ">
                                <UIcon name="i-lucide-thumbs-down" class="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </UContextMenu>

                  <!-- Быстрые ответы (не показывать на follow-up с forceExpand) -->
                  <div v-if="aiEnabled && !('forceExpand' in (message as any)) && message.quickReplies && message.quickReplies.length > 0" class="flex flex-wrap gap-2 mt-3 text-left">
                    <button v-for="reply in message.quickReplies" :key="reply" @click="handleQuickReply(reply, message)"
                      class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                      {{ reply }}
                    </button>
                  </div>

                  <!-- Кнопки разделов по факту наличия данных (если quickReplies не пришли); скрыть для follow-up с forceExpand -->
                  <div v-else-if="aiEnabled && !('forceExpand' in (message as any)) && Array.isArray((message as any).availableSections) && (message as any).availableSections.length > 0" class="flex flex-wrap gap-2 mt-3 text-left">
                    <button v-if="(message as any).availableSections.includes('mkb')" @click="handleQuickReply('Показать кодификатор', message)" class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Показать кодификатор</button>
                    <button v-if="(message as any).availableSections.includes('algo')" @click="handleQuickReply('Показать алгоритмы', message)" class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Показать алгоритмы</button>
                    <button v-if="(message as any).availableSections.includes('ls')" @click="handleQuickReply('Показать локальные статусы', message)" class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Показать локальные статусы</button>
                    <button v-if="(message as any).availableSections.includes('drug')" @click="handleQuickReply('Показать препараты', message)" class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Показать препараты</button>
                  </div>

                  <!-- Наводящие вопросы от ИИ (clarifyingQuestions) -->
                  <div v-if="aiEnabled && Array.isArray((message as any).clarifyingQuestions) && (message as any).clarifyingQuestions.length > 0" class="flex flex-wrap gap-2 mt-3 text-left">
                    <button v-for="q in (message as any).clarifyingQuestions" :key="q" @click="sendQuickMessage(q)"
                      class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                      {{ q }}
                    </button>
                  </div>

                  <!-- Система обратной связи -->
                  <div v-if="message.isFeedbackRequest" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                        <UIcon name="i-lucide-message-circle" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-blue-800 dark:text-blue-200 mb-3">{{ message.text }}</p>
                        <div class="flex gap-2">
                          <UInput 
                            v-model="feedbackInputs[message.id]" 
                            placeholder="Опишите, что не так..."
                            class="flex-1"
                            @keyup.enter="submitUserFeedback(message, feedbackInputs[message.id])"
                          />
                          <UButton 
                            @click="submitUserFeedback(message, feedbackInputs[message.id])"
                            :disabled="!feedbackInputs[message.id]?.trim()"
                            size="sm"
                            color="primary"
                          >
                            Отправить
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Ответ ИИ на обратную связь -->
                  <div v-if="message.isAIResponse && message.analysis" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                        <UIcon name="i-lucide-brain" class="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div class="flex-1">
                        <div class="text-sm text-green-800 dark:text-green-200 mb-3" v-html="message.text"></div>
                        
                        <!-- Анализ проблем -->
                        <div v-if="message.analysis.issues?.length" class="mb-3">
                          <h4 class="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">Выявленные проблемы:</h4>
                          <ul class="text-xs text-green-600 dark:text-green-400 space-y-1">
                            <li v-for="issue in message.analysis.issues" :key="issue" class="flex items-start gap-2">
                              <UIcon name="i-lucide-alert-circle" class="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {{ issue }}
                            </li>
                          </ul>
                        </div>

                        <!-- Предложения по улучшению -->
                        <div v-if="message.analysis.improvements?.length" class="mb-3">
                          <h4 class="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">Предложения по улучшению:</h4>
                          <ul class="text-xs text-green-600 dark:text-green-400 space-y-1">
                            <li v-for="improvement in message.analysis.improvements" :key="improvement" class="flex items-start gap-2">
                              <UIcon name="i-lucide-lightbulb" class="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {{ improvement }}
                            </li>
                          </ul>
                        </div>

                        <!-- Кнопка завершения -->
                        <div v-if="message.showLearnButton" class="flex justify-end">
                          <UButton 
                            @click="completeFeedback(message)"
                            size="sm"
                            color="success"
                            variant="outline"
                          >
                            Понятно, спасибо! 👍
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- learning-note футер -->
                  <div v-if="!message.isUser && hasLearningNote(message.text)" class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <UIcon name="i-lucide-info" class="w-3 h-3 flex-shrink-0" />
                      <span>{{ extractLearningNote(message.text) }}</span>
                    </div>
                  </div>

                  <!-- Кнопки подтверждения очистки -->
                  <div v-if="message.confirmClear" class="mt-2 flex gap-2">
                    <button @click="removeMessage(message.id)" class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Передумал</button>
                    <button @click="confirmClearChat(message.id)" class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer">Очистить чат</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Футер с инпутом -->
        <div class="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div class="max-w-5xl mx-auto px-4 py-4">
            <div class="flex items-center gap-3">
              <div class="flex-1 relative">
                <input ref="chatInput" v-model="currentChatMessage" type="text"
                  placeholder="Задайте вопрос о диагнозах, препаратах или процедурах..."
                  class="block w-full pl-4 pr-12 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200"
                  @keydown.enter="sendChatMessage" :disabled="isChatProcessing">
                <button @click="sendChatMessage" :disabled="!currentChatMessage.trim() || isChatProcessing"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { useFuseSearch } from '~/composables/useFuseSearch'
import { useSearchCache } from '~/composables/useSearchCache'
import { DATA_TYPE_RULES } from '~/composables/useSearchIndexing'

// Роут и путь
const route = useRoute()
const currentPath = computed(() => route.path)

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  category?: string
  url?: string
  codes?: { mkbCode?: string; stationCode?: string }
  data?: any
  searchText?: string
  localis?: string
}

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

// Работа с телефонами
const getPhoneArray = (phones: any): string[] => {
  if (!phones) return []
  
  // Если это уже массив
  if (Array.isArray(phones)) {
    return phones.filter(phone => phone && phone.trim())
  }
  
  // Если это строка, пытаемся распарсить
  if (typeof phones === 'string') {
    try {
      // Пытаемся распарсить как JSON
      const parsed = JSON.parse(phones)
      if (Array.isArray(parsed)) {
        return parsed.filter(phone => phone && phone.trim())
      }
    } catch {
      // Если не JSON, разделяем по запятым или переносам строк
      return phones.split(/[,\n]/).map(phone => phone.trim()).filter(phone => phone)
    }
  }
  
  return []
}

const callPhone = (phone: string) => {
  // Очищаем номер от лишних символов для tel: ссылки
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  window.open(`tel:${cleanPhone}`, '_self')
}

// Переключатель ИИ
const AI_FLAG_KEY = 'bsp-ai-enabled'
const aiEnabledRef = ref<boolean>(false)
try {
  const savedAi = localStorage.getItem(AI_FLAG_KEY)
  aiEnabledRef.value = savedAi ? savedAi === 'true' : false
} catch {}
watch(aiEnabledRef, (v) => {
  try { localStorage.setItem(AI_FLAG_KEY, String(v)) } catch {}
})
const aiEnabled = aiEnabledRef

// Bottom sheet перетаскивание
const panelRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const panelOffsetY = ref(0)
const isDragging = ref(false)
const isClosing = ref(false)
let startY = 0
let startOffset = 0

const getPanelSlideDistance = () => {
  if (typeof window === 'undefined') return 600
  return Math.max(window.innerHeight, panelRef.value?.offsetHeight || 0)
}

const onDragStart = (e: MouseEvent | TouchEvent) => {
  if (isClosing.value) return
  isDragging.value = true
  startY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  startOffset = panelOffsetY.value
  if ('preventDefault' in e) {
    try { (e as MouseEvent).preventDefault() } catch {}
  }
}

const onDragMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  const delta = y - startY
  panelOffsetY.value = Math.max(0, startOffset + delta)
  safePreventDefault(e)
}

const onDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  const threshold = 120
  if (panelOffsetY.value > threshold) {
    isClosing.value = true
    panelOffsetY.value = getPanelSlideDistance()
    setTimeout(() => {
      emit('close')
      searchQuery.value = ''
      panelOffsetY.value = 0
      isClosing.value = false
    }, 260)
  } else {
    panelOffsetY.value = 0
  }
}

function safePreventDefault(e: any) {
  try { if (e && e.cancelable && !e.defaultPrevented) e.preventDefault() } catch {}
}

// Плавное появление
watch(() => props.isOpen, (val) => {
  if (val) {
    isDragging.value = false
    isClosing.value = false
    nextTick(() => {
      panelOffsetY.value = getPanelSlideDistance()
      requestAnimationFrame(() => { panelOffsetY.value = 0 })
    })
  } else {
    panelOffsetY.value = 0
  }
})

// Пользователь (инициалы)
const { user } = useAuth()
const userInitials = computed(() => {
  const f = (user.value?.firstName || '').trim()[0] || ''
  const l = (user.value?.lastName || '').trim()[0] || ''
  return (f + l).toUpperCase() || 'U'
})

// Чат
interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isLoading?: boolean
  results?: SearchResult[]
  quickReplies?: string[]
  userRating?: 'positive' | 'negative'
  originalQuestion?: string
  fullResults?: { mkb?: SearchResult[]; ls?: SearchResult[]; algo?: SearchResult[] }
  isAI?: boolean
  confirmClear?: boolean
  
  // Новые поля для системы обратной связи
  feedbackId?: string
  waitingForFeedback?: boolean
  isFeedbackRequest?: boolean
  originalMessageId?: string
  isAIResponse?: boolean
  analysis?: any
  showLearnButton?: boolean
  isCompleted?: boolean
}

const chatMessages = ref<ChatMessage[]>([])
const currentChatMessage = ref('')
const isChatProcessing = ref(false)
const chatInput = ref<HTMLInputElement>()

// Система обратной связи
const feedbackInputs = ref<Record<string, string>>({})
const contentContainer = ref<HTMLElement>()

// Typewriter state per message
const typingTimers = new Map<string, any>()
function startTypewriter(messageId: string, fullText: string) {
  stopTypewriter(messageId)
  const speed = 12 // chars per tick
  let idx = 0
  const timer = setInterval(() => {
    const msg = chatMessages.value.find(m => m.id === messageId)
    if (!msg) { stopTypewriter(messageId); return }
    idx = Math.min(idx + speed, fullText.length)
    msg.text = fullText.slice(0, idx)
    // автоскролл во время печати, если пользователь не прокрутил далеко вверх
    try {
      const el = contentContainer.value
      if (el) {
        const nearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 120
        if (nearBottom) {
          el.scrollTop = el.scrollHeight
        }
      }
    } catch {}
    if (idx >= fullText.length) {
      stopTypewriter(messageId)
      saveChatToStorage() // persist final text
    }
  }, 20)
  typingTimers.set(messageId, timer)
}
function stopTypewriter(messageId: string) {
  const t = typingTimers.get(messageId)
  if (t) { clearInterval(t); typingTimers.delete(messageId) }
}

// Поиск (используем глобальное состояние)
const { searchQuery, searchResults: globalSearchResults, isSearching, updateCacheStatus } = useGlobalSearch()
const { getSearchData, getCacheInfo } = useSearchCache()
const isPreloading = ref(false)
const isLoadingSearch = ref(false)

// Fuse.js поиск
const { search } = useFuseSearch()

// Рендер Markdown с кастомными тегами
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  let html = text

  // Карточки МКБ
  html = html.replace(/<mkb-cards>([\s\S]*?)<\/mkb-cards>/g, (match, cardsContent) => {
    const cards = cardsContent.trim().split('\n').filter((line: string) => line.trim())
    if (cards.length === 0) return ''
    const cardElements = cards.map((card: string) => {
      const [code, name, category, note, stationCode] = card.split('|')
      return `
        <div class="flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col">
          <div class="p-3 flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-slate-900 dark:text-white text-sm">${name}</h4>
                ${note ? `<p class="text-xs text-slate-600 dark:text-slate-400 italic mt-1">${note}</p>` : ''}
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">МКБ: ${code}</span>
                  ${stationCode ? `<span class="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs font-mono text-green-700 dark:text-green-300">Станция: ${stationCode}</span>` : ''}
                  <span class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">${category}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 mt-auto">
            <div class="flex flex-wrap gap-1 pt-2">
              <button onclick="openMKBCode('${code}', '${category}')" class="mkb-open-btn inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Открыть
              </button>
              <button onclick="copyMKBInfo('${code}', '${name}', '${stationCode || ''}')" class="mkb-copy-btn inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Копировать
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')
    if (cards.length === 1) return `<div class="my-4">${cardElements}</div>`
    return `
      <div class="my-4">
        <div class="mkb-slider-container relative overflow-hidden">
          <div class="mkb-slider flex gap-1 xs:gap-2 sm:gap-3 pb-2 px-2 -mx-2 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing" style="transform: translateX(0px);">
            ${cardElements}
          </div>
        </div>
      </div>
    `
  })

  // Карточки препаратов (без калькуляторов)
  html = html.replace(/<drug-cards>([\s\S]*?)<\/drug-cards>/g, (match, cardsContent) => {
    const cards = cardsContent.trim().split('\n').filter((line: string) => line.trim())
    if (cards.length === 0) return ''
    const cardElements = cards.map((card: string) => {
      const [name, latinName, forms, analogs, drugId] = card.split('|')
      return `
        <div class="flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col">
          <div class="p-3 flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-slate-900 dark:text-white text-sm">${name}</h4>
                ${latinName ? `<p class=\"text-xs text-slate-600 dark:text-slate-400 italic mt-1\">${latinName}</p>` : ''}
                ${forms ? `<p class=\"text-xs text-slate-600 dark:text-slate-400 mt-1\">${forms}</p>` : ''}
                ${analogs ? `<p class=\"text-xs text-slate-600 dark:text-slate-400 mt-1\">Аналоги: ${analogs}</p>` : ''}
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">Препарат</span>
                </div>
              </div>
            </div>
          </div>
          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 mt-auto">
            <div class="flex flex-wrap gap-1 pt-2">
              <button onclick="openDrugDetails('${drugId}', '${name}')" class="drug-open-btn inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Подробнее
              </button>
              <button onclick="copyDrugInfo('${name}', '${latinName}', '${forms}')" class="drug-copy-btn inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Копировать
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')
    if (cards.length === 1) {
      const fullWidthCard = cardElements.replace('flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80', 'w-full max-w-none')
      return `<div class="my-4">${fullWidthCard}</div>`
    }
    return `
      <div class="my-4">
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          ${cardElements}
        </div>
      </div>
    `
  })

  // Карточки подстанций
  html = html.replace(/<substation-cards>([\s\S]*?)<\/substation-cards>/g, (match, cardsContent) => {
    const cards = cardsContent.trim().split('\n').filter((line: string) => line.trim())
    if (cards.length === 0) return ''
    const cardElements = cards.map((card: string) => {
      const [name, address, phones, coords] = card.split('|')
      return `
        <div class="flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col">
          <div class="p-3 flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-slate-900 dark:text-white text-sm">${name}</h4>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${address}</p>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  ${phones && phones !== 'Не указан' && phones.trim() ?
                    `<span class=\"bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs font-mono text-green-700 dark:text-green-300\">📞 ${phones}</span>` :
                    `<span class=\"bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400\">📞 нет данных</span>`}
                </div>
              </div>
            </div>
          </div>
          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 mt-auto">
            <div class="flex flex-wrap gap-1 pt-2">
              ${coords ? `<button onclick=\"openSubstationMap('${coords}', '${name}')\" class=\"substation-map-btn inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer\"><span class=\"w-3 h-3 inline-block\"></span> Карта</button>` : ''}
              ${phones && phones !== 'Не указан' && phones.trim() ? `<button onclick=\"callSubstation('${phones}')\" class=\"substation-call-btn inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer\"><span class=\"w-3 h-3 inline-block\"></span> Позвонить</button>` : `<span class=\"inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs\"><span class=\"w-3 h-3 inline-block\"></span> Нет телефона</span>`}
              <button onclick="copySubstationInfo('${name}', '${address}', '${phones}')" class="substation-copy-btn inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer"><span class="w-3 h-3 inline-block"></span> Копировать</button>
            </div>
          </div>
        </div>
      `
    }).join('')
    if (cards.length === 1) {
      const fullWidthCard = cardElements.replace('flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80', 'w-full max-w-none')
      return `<div class="my-4">${fullWidthCard}</div>`
    }
    return `
      <div class="my-4">
        <div class="substation-slider-container relative overflow-hidden">
          <div class="substation-slider flex gap-1 xs:gap-2 sm:gap-3 pb-2 px-2 -mx-2 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing" style="transform: translateX(0px);">
            ${cardElements}
          </div>
        </div>
      </div>
    `
  })

  // Запрос геолокации блок
  html = html.replace(/<geolocation-request>([\s\S]*?)<\/geolocation-request>/g, (match, content) => {
    return `
      <div class="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-blue-800 dark:text-blue-200 mb-3">${content.trim()}</p>
            <button onclick="requestGeolocation()" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Определить местоположение
            </button>
          </div>
        </div>
      </div>
    `
  })

  // learning-note прячем, покажем ниже
  html = html.replace(/<learning-note>(.*?)<\/learning-note>/g, '<div class="learning-note-footer" style="display: none;">$1</div>')

  // Прочие упрощённые преобразования Markdown
  html = html.replace(/(🔍|💊|📋|💉|⚠️|🏥|💡)\s*\*\*(.*?)\*\*/g, '<div class="mt-3 mb-1"><span class="mr-2">$1<\/span><strong class="font-semibold">$2<\/strong></div>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800 dark:text-slate-200">$1<\/strong>')
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1<\/em>')
  html = html.replace(/^###### (.*$)/gm, '<h6 class="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 mb-1">$1<\/h6>')
  html = html.replace(/^##### (.*$)/gm, '<h5 class="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2 mb-1">$1<\/h5>')
  html = html.replace(/^#### (.*$)/gm, '<h4 class="text-base font-medium text-slate-700 dark:text-slate-300 mt-2 mb-1">$1<\/h4>')
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-3 mb-2">$1<\/h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-3 mb-2">$1<\/h1>')
  html = html.replace(/`([^`]*)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono">$1<\/code>')
  // Сохраняем переводы строк до этапа сборки списков/абзацев

  // Simple Markdown to HTML (very lightweight handling for headings and lists)
  html = html
    .replace(/^###\s+(.*)$/gim, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^\*\*(.*?)\*\*:\s*(.*)$/gim, '<p><span class="font-semibold">$1:</span> $2</p>')
    .replace(/^>\s*(.*)$/gim, '<blockquote class="border-l-4 pl-3 text-slate-600 dark:text-slate-300">$1</blockquote>')
    // списки с возможными ведущими пробелами
    .replace(/^\s*\-\s+(.*)$/gim, '<li class="flex items-start gap-2"><span class="inline-flex mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-green-600 dark:text-green-400"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 0 1.42l-7.5 7.5a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.42L8.5 12.086l6.793-6.796a1 1 0 0 1 1.411 0z" clip-rule="evenodd"/></svg></span><span>$1</span></li>')

  // Wrap consecutive <li> into <ul>
  html = html.replace(/(<li[\s\S]*?<\/li>)(?=(?:\n<li|$))/gim, '$1')
  if (/<li/.test(html)) {
    html = html.replace(/(?:^|\n)(<li[\s\S]*?<\/li>(?:\n<li[\s\S]*?<\/li>)*)/gim, '<ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">$1</ul>')
  }

  // Paragraphs: double newlines to <p>
  html = html.split(/\n\n+/).map(block => {
    if (/^\s*(<h3|<ul|<blockquote|<p|<table|<div|<pre|<code|<li)/.test(block)) return block
    const safe = block.replace(/\n/g, '<br/>')
    return `<p class="leading-relaxed">${safe}<\/p>`
  }).join('\n')

  return html
}

const renderAlgorithmTable = (content: string): string => {
  if (!content) return ''
  
  // Очищаем контент от лишних тегов и оставляем только таблицы
  let html = content
  
  // Удаляем все кроме таблиц
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi)
  if (!tableMatch) return ''
  
  // Берем первую таблицу и стилизуем её
  let table = tableMatch[0]
  
  // Добавляем colgroup для фиксированной ширины колонок (равномерно 33.3333%)
  table = table.replace(/<table([^>]*)>/gi, '<table$1 class="w-full table-fixed border-0 bg-transparent"><colgroup><col style="width: 33.3333%"><col style="width: 33.3333%"><col style="width: 33.3333%"></colgroup>')
  
  // Стили для заголовков (xs на мобильных, sm на остальных устройствах)
  table = table.replace(/<th([^>]*)>/gi, '<th$1 class="px-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-center font-medium whitespace-normal break-words align-middle sticky top-0 z-20 bg-slate-50/25 dark:bg-slate-800">')
  
  // Стили для ячеек (xs на мобильных, sm на остальных устройствах)
  table = table.replace(/<td([^>]*)>/gi, '<td$1 class="p-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-normal break-words align-top bg-white dark:bg-slate-800">')
  
  // Добавляем стили для thead и tbody
  table = table.replace(/<thead>/gi, '<thead class="bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20">')
  table = table.replace(/<tbody>/gi, '<tbody class="divide-y divide-slate-100 dark:divide-slate-700">')
  
  // Добавляем hover эффекты для строк
  table = table.replace(/<tr([^>]*)>/gi, '<tr$1 class="hover:bg-slate-100/60 dark:hover:bg-slate-700/40">')
  
  return table
}

// Функция для добавления внутренних border'ов между колонками
function addTableColumnBorders(tableElement: HTMLTableElement) {
  // Бордеры: у первой колонки справа, у второй слева и справа на md+ экранах
  tableElement.querySelectorAll('thead tr').forEach(tr => {
    const cells = Array.from(tr.children) as HTMLElement[]
    if (cells[0]) cells[0].classList.add('border-r', 'border-slate-100', 'dark:border-slate-700')
    if (cells[1]) {
      cells[1].classList.add('border-l', 'border-slate-100', 'dark:border-slate-700')
      cells[1].classList.add('md:border-r', 'md:border-slate-100', 'md:dark:border-slate-700')
    }
  })
  tableElement.querySelectorAll('tbody tr').forEach(tr => {
    const cells = Array.from(tr.children) as HTMLElement[]
    if (cells[0]) cells[0].classList.add('border-r', 'border-slate-100', 'dark:border-slate-700')
    if (cells[1]) {
      cells[1].classList.add('border-l', 'border-slate-100', 'dark:border-slate-700')
      cells[1].classList.add('md:border-r', 'md:border-slate-100', 'md:dark:border-slate-700')
    }
  })
}

marked.setOptions({ breaks: true, gfm: true })

// ===== Мобильная логика для таблиц алгоритмов =====
function isMobile() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

function setupMobileTableLogic() {
  nextTick(() => {
    const tables = document.querySelectorAll('[data-styled-table-wrapper] table')
    tables.forEach(table => {
      const wrapper = table.closest('[data-styled-table-wrapper]') as HTMLElement
      if (wrapper && !wrapper.hasAttribute('data-mobile-init')) {
        // Добавляем внутренние border'ы между колонками
        addTableColumnBorders(table as HTMLTableElement)
        setupMobileTwoColumn(table as HTMLTableElement)
      }
    })
  })
}

function applyMobileTwoColumnView(wrapper: HTMLElement, table: HTMLTableElement) {
  const mobileTarget = wrapper.getAttribute('data-mobile-col') === '3' ? 3 : 2
  const rows = table.querySelectorAll('thead tr, tbody tr')
  const colgroup = table.querySelector('colgroup') as HTMLElement | null
  const cols = colgroup ? Array.from(colgroup.querySelectorAll('col')) as HTMLElement[] : []

  // Создаем индикаторы точек в шапке таблицы
  if (isMobile()) {
    const thead = table.querySelector('thead')
    if (thead) {
      let dotsContainer = thead.querySelector('[data-mobile-dots-container]') as HTMLElement | null
      if (!dotsContainer) {
        dotsContainer = document.createElement('div')
        dotsContainer.setAttribute('data-mobile-dots-container', '1')
        dotsContainer.classList.add('md:hidden', 'absolute', 'right-2', 'top-1/2', '-translate-y-1/2', 'flex', 'items-center', 'gap-1', 'z-30', 'pointer-events-none', 'bg-slate-100', 'dark:bg-slate-800', 'p-1', 'rounded-full')
        
        const dot2 = document.createElement('span')
        dot2.setAttribute('data-dot', '2')
        dot2.classList.add('inline-block', 'w-1.5', 'h-1.5', 'rounded-full')
        
        const dot3 = document.createElement('span')
        dot3.setAttribute('data-dot', '3')
        dot3.classList.add('inline-block', 'w-1.5', 'h-1.5', 'rounded-full')
        
        dotsContainer.appendChild(dot2)
        dotsContainer.appendChild(dot3)
        thead.appendChild(dotsContainer)
      }
    
      // Активируем соответствующую точку
      const dot2 = dotsContainer.querySelector('[data-dot="2"]') as HTMLElement | null
      const dot3 = dotsContainer.querySelector('[data-dot="3"]') as HTMLElement | null
      const activeCls = ['bg-slate-600', 'dark:bg-slate-200']
      const inactiveCls = ['bg-slate-300', 'dark:bg-slate-600']
      
      if (dot2 && dot3) {
        if (mobileTarget === 2) {
          dot2.classList.add(...activeCls)
          dot2.classList.remove(...inactiveCls)
          dot3.classList.add(...inactiveCls)
          dot3.classList.remove(...activeCls)
        } else {
          dot3.classList.add(...activeCls)
          dot3.classList.remove(...inactiveCls)
          dot2.classList.add(...inactiveCls)
          dot2.classList.remove(...activeCls)
        }
      }
    }
    
    // На мобильных: 2 колонки (первая 35% + выбранная 65%), фиксированная раскладка
    table.style.tableLayout = 'fixed'
    cols.forEach((c, idx) => {
      // ширины колонок на мобилках
      if (idx === 0) c.style.width = '35%'
      if (idx === 1) {
        c.style.width = '65%'
        c.style.display = mobileTarget === 2 ? '' : 'none'
      }
      if (idx === 2) {
        c.style.width = '65%'
        c.style.display = mobileTarget === 3 ? '' : 'none'
      }
    })

    rows.forEach((tr, rowIndex) => {
      const cells = Array.from(tr.children) as HTMLElement[]
      const isHead = !!(tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead')
      
      if (cells[0]) {
        cells[0].classList.remove('hidden', 'w-0', 'p-0')
        cells[0].style.width = '35%'
        cells[0].style.maxWidth = '35%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[0].tagName === 'TH') {
          cells[0].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      
      if (cells[1]) {
        const hide = mobileTarget !== 2
        cells[1].classList.toggle('hidden', hide)
        cells[1].classList.toggle('w-0', hide)
        cells[1].classList.toggle('p-0', hide)
        cells[1].style.width = hide ? '' : '65%'
        cells[1].style.maxWidth = hide ? '' : '65%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[1].tagName === 'TH') {
          cells[1].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      
      if (cells[2]) {
        const hide = mobileTarget !== 3
        cells[2].classList.toggle('hidden', hide)
        cells[2].classList.toggle('w-0', hide)
        cells[2].classList.toggle('p-0', hide)
        cells[2].style.width = hide ? '' : '65%'
        cells[2].style.maxWidth = hide ? '' : '65%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[2].tagName === 'TH') {
          cells[2].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
    })
  } else {
    // Десктоп: возвращаем 3 колонки и фиксированную ширину
    table.style.tableLayout = 'fixed'
    if (cols.length === 3) {
      cols.forEach((c, idx) => {
        c.style.display = ''
        // Первая колонка фикс 30%, остальные — авто
        if (idx === 0) c.style.width = '30%'
        else c.style.width = ''
      })
    }
    
    // Убираем индикаторы точек на десктопе
    const thead = table.querySelector('thead')
    if (thead) {
      const dotsContainer = thead.querySelector('[data-mobile-dots-container]') as HTMLElement | null
      if (dotsContainer) dotsContainer.remove()
    }
    rows.forEach((tr) => {
      const cells = Array.from(tr.children) as HTMLElement[]
      const isHead = !!(tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead')
      
      if (cells[0]) { 
        cells[0].classList.remove('hidden', 'w-0', 'p-0'); 
        // Фиксированная ширина первой колонки на десктопе
        cells[0].style.width = '30%'
        cells[0].style.maxWidth = '30%'
        // Убираем стили обрезки текста для десктопа
        if (isHead && cells[0].tagName === 'TH') {
          cells[0].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      if (cells[1]) {
        cells[1].classList.remove('hidden', 'w-0', 'p-0'); 
        cells[1].style.width = ''
        // Убираем стили обрезки текста и индикаторы для десктопа
        if (isHead && cells[1].tagName === 'TH') {
          cells[1].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis', 'relative')
        }
      }
      if (cells[2]) {
        cells[2].classList.remove('hidden', 'w-0', 'p-0'); 
        cells[2].style.width = ''
        // Убираем стили обрезки текста для десктопа
        if (isHead && cells[2].tagName === 'TH') {
          cells[2].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
    })
  }
}

function setupMobileTwoColumn(table: HTMLTableElement) {
  const wrapper = table.closest('[data-styled-table-wrapper]') as HTMLElement | null
  if (!wrapper) return
  if (wrapper.getAttribute('data-mobile-init') === '1') {
    // Обновим отображение при повторном вызове (напр., при ререндере)
    applyMobileTwoColumnView(wrapper, table)
    return
  }
  wrapper.setAttribute('data-mobile-init', '1')
  // По умолчанию показываем 2-ю колонку на мобильных
  if (!wrapper.getAttribute('data-mobile-col')) wrapper.setAttribute('data-mobile-col', '2')

  // Обработчики свайпов
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTs = 0
  let isDragging = false
  let lastDx = 0
  const minDistance = 60 // пикселей
  wrapper.style.touchAction = 'pan-y'
  wrapper.addEventListener('touchstart', (e: TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    touchStartX = t.clientX
    touchStartY = t.clientY
    touchStartTs = Date.now()
    isDragging = true
    lastDx = 0
  }, { passive: true })
  wrapper.addEventListener('touchmove', (e: TouchEvent) => {
    if (!isMobile() || !isDragging) return
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    // Только горизонтальный доминирующий жест
    if (Math.abs(dx) <= Math.abs(dy) * 1.2) return
    lastDx = dx
  }, { passive: true })

  wrapper.addEventListener('touchend', (e: TouchEvent) => {
    if (!isMobile()) return
    if (!e.changedTouches || e.changedTouches.length === 0) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    const dt = Date.now() - touchStartTs
    // Условия для валидного горизонтального свайпа
    const maxDuration = 600 // мс
    const horizontalDominance = Math.abs(dx) > Math.abs(dy) * 1.5
    const shouldSwitch = Math.abs(dx) >= minDistance && horizontalDominance && dt <= maxDuration
    
    if (shouldSwitch) {
      if (dx < 0) wrapper.setAttribute('data-mobile-col', '3')
      else wrapper.setAttribute('data-mobile-col', '2')
      
      applyMobileTwoColumnView(wrapper, table)
    }
    isDragging = false
  }, { passive: true })

  // На ресайз восстанавливаем/применяем вид
  const onResize = () => applyMobileTwoColumnView(wrapper, table)
  window.addEventListener('resize', onResize)

  // Начальная отрисовка
  applyMobileTwoColumnView(wrapper, table)
}

const closePanel = () => {
  panelOffsetY.value = 24
  setTimeout(() => {
    emit('close')
    searchQuery.value = ''
    panelOffsetY.value = 0
  }, 180)
}

// learning-note helpers
const hasLearningNote = (text: string): boolean => text.includes('<learning-note-footer>')
const extractLearningNote = (text: string): string => {
  const match = text.match(/<div class=\"learning-note-footer\">(.*?)<\/div>/)
  return match ? match[1] : ''
}

// Инициализация иконок и слайдеров для карточек
const initializeMKBIcons = () => {
  nextTick(() => {
    document.querySelectorAll('.mkb-open-btn span').forEach(span => {
      if (!span.innerHTML) span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
    })
    document.querySelectorAll('.mkb-copy-btn span').forEach(span => {
      if (!span.innerHTML) span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>'
    })
    document.querySelectorAll('.substation-map-btn span').forEach(span => {
      if (!span.innerHTML) span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
    })
    document.querySelectorAll('.substation-call-btn span').forEach(span => {
      if (!span.innerHTML) span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>'
    })
    document.querySelectorAll('.substation-copy-btn span').forEach(span => {
      if (!span.innerHTML) span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>'
    })
    initializeMKBSliders()
    initializeSubstationSliders()
  })
}

const initializeMKBSliders = () => {
  document.querySelectorAll('.mkb-slider:not([data-initialized])').forEach(sliderElement => {
    const slider = sliderElement as HTMLElement
    slider.dataset.initialized = 'true'
    let isDragging = false
    let startX = 0
    let currentTranslate = 0
    let prevTranslate = 0
    let animationId = 0
    const getConstraints = () => {
      const container = slider.parentElement as HTMLElement
      const containerWidth = container.offsetWidth
      const sliderWidth = slider.scrollWidth
      return Math.min(0, containerWidth - sliderWidth)
    }
    const setSliderPosition = () => { slider.style.transform = `translateX(${currentTranslate}px)` }
    const animation = () => { setSliderPosition(); if (isDragging) { animationId = requestAnimationFrame(animation) } }
    const handleMouseDown = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) return
      isDragging = true
      startX = (e as MouseEvent).clientX
      prevTranslate = currentTranslate
      slider.classList.remove('transition-transform')
      slider.classList.add('cursor-grabbing')
      slider.style.userSelect = 'none'
      animationId = requestAnimationFrame(animation)
      e.preventDefault()
    }
    const handleMouseMove = (e: Event) => {
      if (!isDragging) return
      const currentX = (e as MouseEvent).clientX
      const deltaX = currentX - startX
      const maxTranslate = getConstraints()
      currentTranslate = Math.max(maxTranslate, Math.min(0, prevTranslate + deltaX))
      e.preventDefault()
    }
    const handleMouseUp = () => {
      if (!isDragging) return
      isDragging = false
      cancelAnimationFrame(animationId)
      slider.classList.add('transition-transform')
      slider.classList.remove('cursor-grabbing')
      slider.style.userSelect = ''
      prevTranslate = currentTranslate
    }
    const handleTouchStart = (e: Event) => {
      isDragging = true
      startX = (e as TouchEvent).touches[0].clientX
      prevTranslate = currentTranslate
      slider.classList.remove('transition-transform')
      animationId = requestAnimationFrame(animation)
    }
    const handleTouchMove = (e: Event) => {
      if (!isDragging) return
      const currentX = (e as TouchEvent).touches[0].clientX
      const deltaX = currentX - startX
      const maxTranslate = getConstraints()
      currentTranslate = Math.max(maxTranslate, Math.min(0, prevTranslate + deltaX))
      e.preventDefault()
    }
    const handleTouchEnd = () => {
      if (!isDragging) return
      isDragging = false
      cancelAnimationFrame(animationId)
      prevTranslate = currentTranslate
      slider.classList.add('transition-transform')
    }
    slider.addEventListener('mousedown', handleMouseDown, { passive: false })
    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp, { passive: false })
    slider.addEventListener('touchstart', handleTouchStart, { passive: false })
    slider.addEventListener('touchmove', handleTouchMove, { passive: false })
    slider.addEventListener('touchend', handleTouchEnd, { passive: false })
    slider.addEventListener('dragstart', (e) => e.preventDefault())
    slider.addEventListener('selectstart', (e) => e.preventDefault())
  })
}

const initializeSubstationSliders = () => {
  document.querySelectorAll('.substation-slider:not([data-initialized])').forEach(sliderElement => {
    const slider = sliderElement as HTMLElement
    slider.dataset.initialized = 'true'
    let isDragging = false
    let startX = 0
    let currentTranslate = 0
    let prevTranslate = 0
    let animationId = 0
    const setSliderPosition = () => { slider.style.transform = `translateX(${currentTranslate}px)` }
    const animation = () => { setSliderPosition(); if (isDragging) requestAnimationFrame(animation) }
    const handleMouseDown = (e: Event) => {
      if ((e.target as HTMLElement).closest('button')) return
      isDragging = true
      startX = (e as MouseEvent).clientX
      prevTranslate = currentTranslate
      slider.classList.remove('transition-transform')
      slider.classList.add('cursor-grabbing')
      slider.style.userSelect = 'none'
      animationId = requestAnimationFrame(animation)
    }
    const handleMouseMove = (e: Event) => {
      if (!isDragging) return
      const currentX = (e as MouseEvent).clientX
      const diffX = currentX - startX
      currentTranslate = prevTranslate + diffX
      const maxTranslate = 0
      const minTranslate = -(slider.scrollWidth - slider.offsetWidth)
      currentTranslate = Math.max(Math.min(currentTranslate, maxTranslate), minTranslate)
    }
    const handleMouseUp = () => {
      if (!isDragging) return
      isDragging = false
      cancelAnimationFrame(animationId)
      slider.classList.add('transition-transform')
      slider.classList.remove('cursor-grabbing')
      slider.style.userSelect = ''
      prevTranslate = currentTranslate
    }
    const handleTouchStart = (e: Event) => {
      isDragging = true
      startX = (e as TouchEvent).touches[0].clientX
      prevTranslate = currentTranslate
      slider.classList.remove('transition-transform')
      animationId = requestAnimationFrame(animation)
    }
    const handleTouchMove = (e: Event) => {
      if (!isDragging) return
      const currentX = (e as TouchEvent).touches[0].clientX
      const diffX = currentX - startX
      currentTranslate = prevTranslate + diffX
      const maxTranslate = 0
      const minTranslate = -(slider.scrollWidth - slider.offsetWidth)
      currentTranslate = Math.max(Math.min(currentTranslate, maxTranslate), minTranslate)
    }
    const handleTouchEnd = () => {
      if (!isDragging) return
      isDragging = false
      cancelAnimationFrame(animationId)
      prevTranslate = currentTranslate
      slider.classList.add('transition-transform')
    }
    slider.addEventListener('mousedown', handleMouseDown, { passive: false })
    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp, { passive: false })
    slider.addEventListener('touchstart', handleTouchStart, { passive: false })
    slider.addEventListener('touchmove', handleTouchMove, { passive: false })
    slider.addEventListener('touchend', handleTouchEnd, { passive: false })
    slider.addEventListener('dragstart', (e) => e.preventDefault())
    slider.addEventListener('selectstart', (e) => e.preventDefault())
  })
}

// Глобальные функции для карточек/кнопок
if (typeof window !== 'undefined') {
  ;(window as any).openMKBCode = async (mkbCode: string, categoryName: string) => {
    try {
      const response = await $fetch('/api/categories') as any
      const categories = response.items || []
      const category = categories.find((cat: any) => cat.name === categoryName)
      if (!category) return
      closePanel()
      navigateTo(`/codifier/${category.url}?mkb=${mkbCode}`)
    } catch (e) { console.error(e) }
  }
  ;(window as any).copyMKBInfo = async (mkbCode: string, name: string, stationCode: string) => {
    const info = `МКБ: ${mkbCode}${stationCode ? ` | Станция: ${stationCode}` : ''}\n${name}`
    try { await navigator.clipboard.writeText(info) } catch (error) {
      const textArea = document.createElement('textarea'); textArea.value = info; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea)
    }
  }
  ;(window as any).openSubstationMap = (coords: string, name: string) => {
    if (!coords) return
    const [lat, lon] = coords.split(',').map(c => parseFloat(c.trim()))
    if (isNaN(lat) || isNaN(lon)) return
    closePanel()
    navigateTo(`/substations?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`)
  }
  ;(window as any).openDrugDetails = (drugId: string, _drugName: string) => {
    if (!drugId || drugId === 'undefined') return
    navigateTo(`/drugs?drug=${drugId}`)
  }
  ;(window as any).copyDrugInfo = async (name: string, latinName: string, forms: string) => {
    let info = name
    if (latinName && latinName !== 'undefined') info += `\nЛатинское название: ${latinName}`
    if (forms && forms !== 'undefined') info += `\nФорма выпуска: ${forms}`
    try { await navigator.clipboard.writeText(info) } catch (error) {
      const textArea = document.createElement('textarea'); textArea.value = info; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea)
    }
  }
  ;(window as any).callSubstation = (phones: string) => {
    if (!phones || phones === 'Не указан') return
    const phone = phones.split(',')[0].trim()
    window.location.href = `tel:${phone}`
  }
  ;(window as any).copySubstationInfo = async (name: string, address: string, phones: string) => {
    const info = `${name}\nАдрес: ${address}\nТелефон: ${phones}`
    try { await navigator.clipboard.writeText(info) } catch (error) {
      const textArea = document.createElement('textarea'); textArea.value = info; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea)
    }
  }
  ;(window as any).requestGeolocation = async () => {
    if (!navigator.geolocation) { alert('Геолокация не поддерживается вашим браузером'); return }
    const lastBotMessage = [...chatMessages.value].reverse().find(msg => !msg.isUser && msg.text.includes('<geolocation-request>'))
    if (!lastBotMessage) return
    try {
      lastBotMessage.text = lastBotMessage.text.replace(/<geolocation-request>[\s\S]*?<\/geolocation-request>/g,
        `<div class=\"my-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg\">\n          <div class=\"flex items-start gap-3\">\n            <div class=\"flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center\">\n              <svg class=\"w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin\" fill=\"none\" viewBox=\"0 0 24 24\">\n                <circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle>\n                <path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>\n              </svg>\n            </div>\n            <div class=\"flex-1\">\n              <p class=\"text-sm text-yellow-800 dark:text-yellow-200\">Определяем ваше местоположение...</p>\n            </div>\n          </div>\n        </div>`)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
      })
      const { latitude, longitude } = position.coords
      lastBotMessage.text = lastBotMessage.text.replace(/<div class=\"my-4 p-4 bg-yellow-50[\s\S]*?<\/div>/,
        `<div class=\"my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg\">\n          <div class=\"flex items-start gap-3\">\n            <div class=\"flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center\">\n              <svg class=\"w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin\" fill=\"none\" viewBox=\"0 0 24 24\">\n                <circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle>\n                <path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>\n              </svg>\n            </div>\n            <div class=\"flex-1\">\n              <p class=\"text-sm text-blue-800 dark:text-blue-200\">Ищем ближайшие подстанции...</p>\n            </div>\n          </div>\n        </div>`)
      const nearestSubstations = await $fetch('/api/substations/nearest', { method: 'POST', body: { latitude, longitude } })
      const updatedResponse = generateNearestSubstationsResponse(nearestSubstations)
      lastBotMessage.text = updatedResponse
      saveChatToStorage()
      setTimeout(() => { initializeMKBIcons() }, 100)
    } catch (error: any) {
      let errorMessage = 'Не удалось определить местоположение. '
      if (error.code === 1) errorMessage += 'Доступ к геолокации запрещен.'
      else if (error.code === 2) errorMessage += 'Местоположение недоступно.'
      else if (error.code === 3) errorMessage += 'Превышено время ожидания.'
      else errorMessage += 'Произошла неизвестная ошибка.'
      if (lastBotMessage) {
        lastBotMessage.text = lastBotMessage.text.replace(/<div class=\"my-4 p-4 bg-(?:yellow|blue)-50[\s\S]*?<\/div>/,
          `<div class=\"my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg\">\n            <div class=\"flex items-start gap-3\">\n              <div class=\"flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center\">\n                <svg class=\"w-4 h-4 text-red-600 dark:text-red-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                  <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\"></path>\n                </svg>\n              </div>\n              <div class=\"flex-1\">\n                <p class=\"text-sm text-red-800 dark:text-red-200\">${errorMessage}</p>\n                <button onclick=\"requestGeolocation()\" class=\"inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors mt-2\">\n                  Попробовать снова\n                </button>\n              </div>\n            </div>\n          </div>`)
        saveChatToStorage()
      }
    }
  }
}

// Ответ с ближайшими подстанциями
const generateNearestSubstationsResponse = (data: any): string => {
  if (!data.success || !data.substations || data.substations.length === 0) {
    return 'К сожалению, не удалось найти ближайшие подстанции. Попробуйте позже или обратитесь к диспетчерской службе.'
  }
  const { substations } = data
  let response = `**Ближайшие подстанции СМП к вашему местоположению:**\n\n`
  response += '<substation-cards>\n'
  substations.forEach((substation: any) => {
    const phones = Array.isArray(substation.phones) ? substation.phones.join(', ') : (substation.phone || 'Не указан')
    const coords = substation.location?.coordinates ? `${substation.location.coordinates[1]},${substation.location.coordinates[0]}` : ''
    const distance = substation.distanceKm ? `${substation.distanceKm} км` : ''
    const travelTime = substation.estimatedTravelTime ? `${substation.estimatedTravelTime} мин` : ''
    let nameWithDistance = substation.name
    if (distance && travelTime) nameWithDistance += ` (${distance}, ~${travelTime})`
    else if (distance) nameWithDistance += ` (${distance})`
    response += `${nameWithDistance}|${substation.address || 'Адрес не указан'}|${phones}|${coords}\n`
  })
  response += '</substation-cards>\n\n'
  response += `💡 **Информация:**\n`
  response += `- Расстояние и время рассчитаны от вашего текущего местоположения\n`
  response += `- Время доезда приблизительное (средняя скорость 40 км/ч)\n`
  return response
}

// Ответ с подстанциями рядом с указанной
const generateNearbySubstationsResponse = (data: any): string => {
  if (!data.success || !data.nearbySubstations || data.nearbySubstations.length === 0) {
    return `К сожалению, рядом с подстанцией "${data.sourceSubstation?.name || 'указанной'}" не найдено других подстанций в радиусе ${(data.searchRadius || 3000) / 1000} км.`
  }
  const { sourceSubstation, nearbySubstations, searchRadius } = data
  let response = `**Подстанции рядом с "${sourceSubstation.name}" (в радиусе ${searchRadius / 1000} км):**\n\n`
  response += '<substation-cards>\n'
  nearbySubstations.forEach((substation: any) => {
    const phones = Array.isArray(substation.phones) ? substation.phones.join(', ') : (substation.phone || 'Не указан')
    const coords = substation.location?.coordinates ? `${substation.location.coordinates[1]},${substation.location.coordinates[0]}` : ''
    const distance = substation.distanceKm ? `${substation.distanceKm} км` : ''
    const travelTime = substation.estimatedTravelTime ? `${substation.estimatedTravelTime} мин` : ''
    let nameWithDistance = substation.name
    if (distance) nameWithDistance += ` (${distance}${travelTime ? `, ~${travelTime}` : ''})`
    response += `${nameWithDistance}|${substation.address || 'Адрес не указан'}|${phones}|${coords}\n`
  })
  response += '</substation-cards>\n\n'
  response += `💡 **Информация:**\n`
  response += `- Показаны подстанции в радиусе ${searchRadius / 1000} км от "${sourceSubstation.name}"\n`
  response += `- Расстояние рассчитано по прямой линии\n`
  response += `- Время доезда между подстанциями приблизительное\n`
  return response
}

// Оценка ответа с интеллектуальной обратной связью
const rateBotResponse = async (message: ChatMessage, rating: 'positive' | 'negative') => {
  if (message.userRating) return
  
  try {
    if (rating === 'positive') {
      // Для лайка анализируем весь чат до этого сообщения и сохраняем для обучения
      await handlePositiveFeedback(message)
      message.userRating = rating
      saveChatToStorage()
    } else {
      // Для дизлайка запускаем интеллектуальную систему обратной связи
      await handleNegativeFeedback(message)
    }
  } catch (error) {
    console.error('Ошибка обработки оценки:', error)
    alert('Ошибка обработки оценки. Попробуйте еще раз.')
  }
}

// Обработка позитивной обратной связи
const handlePositiveFeedback = async (message: ChatMessage) => {
  try {
    // Находим индекс текущего сообщения в чате
    const messageIndex = chatMessages.value.findIndex((m: ChatMessage) => m.id === message.id)
    if (messageIndex === -1) return

    // Берем все сообщения до этого (включительно)
    const chatHistory = chatMessages.value.slice(0, messageIndex + 1)
    
    // Отправляем на анализ и сохранение для обучения
    console.log('📤 Отправляем лайк:', {
      messageId: message.id,
      chatHistoryLength: chatHistory.length,
      lastMessage: chatHistory[chatHistory.length - 1]
    })
    
    const response = await $fetch('/api/feedback/handle', {
      method: 'POST',
      body: {
        action: 'like',
        messageId: message.id,
        chatHistory: chatHistory,
        userIdentifier: 'user'
      }
    })

    if (response.success) {
      console.log('✅ Положительная обратная связь сохранена для обучения')
    }
  } catch (error) {
    console.error('Ошибка обработки положительной обратной связи:', error)
  }
}

// Обработка негативной обратной связи
const handleNegativeFeedback = async (message: ChatMessage) => {
  try {
    // Отправляем запрос на создание записи обратной связи
    const response = await $fetch('/api/feedback/handle', {
      method: 'POST',
      body: {
        action: 'dislike',
        messageId: message.id,
        originalQuery: message.originalQuestion || 'Неизвестный запрос',
        aiResponse: message.text || 'Пустой ответ ИИ',
        searchResults: message.results || [],
        userIdentifier: 'user' // Можно получить из системы аутентификации
      }
    })

    if (response.success) {
      // Помечаем сообщение как ожидающее обратную связь
      message.userRating = 'negative'
      message.feedbackId = (response as any).feedbackId
      message.waitingForFeedback = true
      
      // Добавляем сообщение ИИ с просьбой о обратной связи
      const feedbackMessage: ChatMessage = {
        id: `feedback-${Date.now()}`,
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        isFeedbackRequest: true,
        originalMessageId: message.id
      }
      
      chatMessages.value.push(feedbackMessage)
      saveChatToStorage()
      
      // Автоскролл к новому сообщению
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Ошибка создания обратной связи:', error)
    alert('Ошибка создания обратной связи. Попробуйте еще раз.')
  }
}

// Отправка обратной связи пользователя
const submitUserFeedback = async (feedbackMessage: ChatMessage, userFeedback: string) => {
  try {
    const response = await $fetch('/api/feedback/handle', {
      method: 'POST',
      body: {
        action: 'submit_feedback',
        messageId: feedbackMessage.originalMessageId,
        userFeedback: userFeedback,
        userIdentifier: 'user'
      }
    })

    if (response.success) {
      // Обновляем сообщение с ответом ИИ
      feedbackMessage.text = response.message
      feedbackMessage.isFeedbackRequest = false
      feedbackMessage.isAIResponse = true
      feedbackMessage.analysis = (response as any).analysis
      
      // Добавляем кнопку "Понятно" для завершения обратной связи
      feedbackMessage.showLearnButton = true
      
      saveChatToStorage()
      
      // Автоскролл
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Ошибка отправки обратной связи:', error)
    alert('Ошибка отправки обратной связи. Попробуйте еще раз.')
  }
}

// Завершение процесса обратной связи
const completeFeedback = async (feedbackMessage: ChatMessage) => {
  try {
    const response = await $fetch('/api/feedback/handle', {
      method: 'POST',
      body: {
        action: 'learn',
        messageId: feedbackMessage.originalMessageId,
        userIdentifier: 'user'
      }
    })

    if (response.success) {
      // Обновляем сообщение с финальным ответом
      feedbackMessage.text = response.message
      feedbackMessage.showLearnButton = false
      feedbackMessage.isCompleted = true
      
      // Убираем флаг ожидания обратной связи с оригинального сообщения
      const originalMessage = chatMessages.value.find(m => m.id === feedbackMessage.originalMessageId)
      if (originalMessage) {
        originalMessage.waitingForFeedback = false
      }
      
      saveChatToStorage()
    }
  } catch (error) {
    console.error('Ошибка завершения обратной связи:', error)
    alert('Ошибка завершения обратной связи. Попробуйте еще раз.')
  }
}

const saveFeedback = async (message: ChatMessage, rating: 'positive' | 'negative', userComment?: string) => {
  const sanitize = (s: string, max = 2000) => String(s || '').slice(0, max)
  const safeResults = (message.results || []).slice(0, 10).map((r: any) => ({
    id: sanitize(r.id || r._id || '', 128),
    title: sanitize(r.title || r.data?.name || '', 512),
    type: sanitize(r.type || '', 64),
    description: sanitize(r.description || r.data?.description || '', 1000)
  }))
  const feedbackData = {
    question: sanitize(message.originalQuestion || 'Неизвестный вопрос', 512),
    answer: sanitize(message.text || '', 4000),
    rating,
    userComment: sanitize(userComment || '', 1000),
    searchResults: safeResults
  }
  return await $fetch('/api/feedback', { method: 'POST', body: feedbackData })
}

// Копирование
const copyToClipboard = async (text: string) => {
  try { await navigator.clipboard.writeText(text) } catch (err) { console.error('Ошибка копирования:', err) }
}

// Scroll lock
const lockScroll = () => { if (typeof window !== 'undefined') document.body.style.overflow = 'hidden' }
const unlockScroll = () => { if (typeof window !== 'undefined') document.body.style.overflow = '' }

// Сохранение/восстановление скролла панели
const SCROLL_STORAGE_PREFIX = 'bsp-panel-scroll'
const getScrollKey = () => `${SCROLL_STORAGE_PREFIX}:${currentPath.value || 'root'}`
let scrollSaveTimer: any = null
const savePanelScroll = () => {
  if (typeof window === 'undefined') return
  const el = contentContainer.value
  if (!el) return
  try { localStorage.setItem(getScrollKey(), String(el.scrollTop || 0)) } catch {}
}
const restorePanelScroll = () => {
  if (typeof window === 'undefined') return
  const el = contentContainer.value
  if (!el) return
  try {
    const raw = localStorage.getItem(getScrollKey())
    const y = raw ? parseInt(raw, 10) : 0
    if (!Number.isNaN(y) && y > 0) {
      el.scrollTop = y
    } else {
      // Если нет сохранённой позиции, скроллим вниз
      el.scrollTop = el.scrollHeight
    }
  } catch {}
}
const onPanelScroll = () => { if (scrollSaveTimer) clearTimeout(scrollSaveTimer); scrollSaveTimer = setTimeout(savePanelScroll, 200) }

// Поиск в реальном времени по API
const performSearch = async (query: string) => {
  if (!query.trim() || isLoadingSearch.value) return
  isLoadingSearch.value = true
  
  try {
    // Используем кеш для загрузки данных
    const { getSearchData } = useSearchCache()
    let searchData
    
    try {
      // Пытаемся получить данные из кеша или API
      const cachedData = await getSearchData()
      
      if (!cachedData) {
        throw new Error('Не удалось загрузить данные для поиска')
      }
      
      // Преобразуем данные в формат, ожидаемый компонентом
      searchData = {
        success: true,
        data: {
          localStatuses: { items: cachedData.filter(item => item.type === 'ls') },
          mkbCodes: { items: cachedData.filter(item => item.type === 'mkb') },
          algorithms: { items: cachedData.filter(item => item.type === 'algorithm') },
          drugs: { items: cachedData.filter(item => item.type === 'drug') },
          substations: { items: cachedData.filter(item => item.type === 'substation') }
        }
      }
      
      console.log('📋 Данные загружены из кеша/API для BottomSearchPanel')
      
      // Обновляем статус кеша в глобальном состоянии
      const { getCacheInfo } = useSearchCache()
      const cacheInfo = getCacheInfo()
      updateCacheStatus(cacheInfo.cachedData !== null)
      
    } catch (error) {
      console.error('❌ Ошибка при загрузке данных из кеша:', error)
      
      // Fallback: используем старые API endpoints
      console.log('🔄 Используем fallback API endpoints...')
      const [mkbData, lsResults, algoResults, drugResults, substationResults] = await Promise.all([
        $fetch('/api/mkb/all').catch(() => ({ success: true, items: [] })),
        $fetch('/api/local-statuses/all').catch(() => ({ success: true, items: [] })),
        $fetch('/api/algorithms').catch(() => ({ success: true, items: [] })),
        $fetch('/api/drugs').catch(() => ({ success: true, items: [] })),
        $fetch('/api/substations').catch(() => ({ success: true, items: [] }))
      ])
      
      searchData = {
        success: true,
        data: {
          mkbCodes: mkbData,
          localStatuses: lsResults,
          algorithms: algoResults,
          drugs: drugResults,
          substations: substationResults
        }
      }
      
      console.log('📡 Fallback API загружен для BottomSearchPanel')
      
      // Обновляем статус кеша (данные не из кеша)
      updateCacheStatus(false)
    }
    
    const { data } = searchData as any
    const mkbData = data.mkbCodes
    const lsResults = data.localStatuses
    const algoResults = data.algorithms
    const drugResults = data.drugs
    const substationResults = data.substations
    
    // Подготавливаем данные для Fuse.js
    const prepareSearchItems = (items: any[], type: 'mkb' | 'ls' | 'algorithm' | 'drug' | 'substation') => {
      return items.map((item: any) => {
        const prepared = {
          _id: item._id,
          title: item.name || item.title,
          name: item.name || item.title,
          description: item.description || item.note,
          note: item.note,
          localis: item.localis,
          content: item.content,
          mkbCode: item.mkbCode,
          stationCode: item.stationCode,
          code: item.code,
          category: item.category,
          section: item.section?.name || item.section,
          latinName: item.latinName,
          synonyms: item.synonyms,
          forms: item.forms,
          address: item.address,
          phones: item.phones,
          phone: item.phone,
          region: item.region,
          regionName: item.regionName,
          coordinates: item.location?.coordinates ? [item.location.coordinates[1], item.location.coordinates[0]] : null,
          type
        }
        
        
        return prepared
      })
    }
    
    // Проверяем, есть ли в запросе слово "подстанция" или адресные слова
    const queryLower = query.toLowerCase()
    const substationKeywords = ['подстанция', 'подстанции']
    const addressKeywords = ['улица', 'ул', 'проспект', 'пр', 'переулок', 'пер', 'площадь', 'пл', 'бульвар', 'б-р', 'шоссе', 'ш', 'набережная', 'наб', 'корпус', 'к', 'строение', 'стр', 'квартал', 'кв', 'микрорайон', 'мкр', 'район', 'р-н', 'область', 'обл', 'город', 'г', 'поселок', 'пос', 'село', 'с', 'деревня', 'дер']
    
    // Более точная проверка адресных слов - только как отдельные слова
    const hasAddressKeywords = addressKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      return regex.test(queryLower)
    })
    
    const isSubstationSearch = substationKeywords.some(keyword => queryLower.includes(keyword)) || hasAddressKeywords
    
    // Извлекаем номер подстанции из запроса
    const substationNumberMatch = query.match(/(\d+)/)
    const substationNumber = substationNumberMatch ? substationNumberMatch[1] : null
    
    let allItems: any[] = []
    
    if (isSubstationSearch) {
      // Если в запросе есть "подстанция", ищем только подстанции
      let substationItems = (substationResults as any).items
      
      // Если есть конкретный номер подстанции, фильтруем по нему
      if (substationNumber) {
        substationItems = substationItems.filter((item: any) => {
          const name = (item.name || '').toLowerCase()
          const description = (item.description || '').toLowerCase()
          const address = (item.address || '').toLowerCase()
          
          // Ищем номер в названии, описании или адресе
          return name.includes(substationNumber) || 
                 description.includes(substationNumber) || 
                 address.includes(substationNumber)
        })
      }
      
      // Если поиск по адресным словам, дополнительно фильтруем по адресу
      if (addressKeywords.some(keyword => queryLower.includes(keyword))) {
        substationItems = substationItems.filter((item: any) => {
          const address = (item.address || '').toLowerCase()
          const name = (item.name || '').toLowerCase()
          const description = (item.description || '').toLowerCase()
          
          // Ищем адресные слова в адресе, названии или описании
          return addressKeywords.some(keyword => 
            address.includes(keyword) || 
            name.includes(keyword) || 
            description.includes(keyword)
          ) || address.includes(queryLower) || 
               name.includes(queryLower) || 
               description.includes(queryLower)
        })
      }
      
      allItems = [
        ...prepareSearchItems(substationItems, 'substation')
      ]
    } else {
      // Обычный поиск по всем типам данных
      allItems = [
        ...prepareSearchItems((mkbData as any).items, 'mkb'),
        ...prepareSearchItems((lsResults as any).items, 'ls'),
        ...prepareSearchItems((algoResults as any).items, 'algorithm'),
        ...prepareSearchItems((drugResults as any).items, 'drug'),
        ...prepareSearchItems((substationResults as any).items, 'substation')
      ]
    }
    
    // Выполняем поиск с помощью Fuse.js
    const fuseResults = search(allItems, query)
    
    console.log('🔍 Fuse.js результаты:', fuseResults.length, 'элементов')
    if (fuseResults.length > 0) {
    console.log('📋 Первые результаты Fuse.js:', fuseResults.slice(0, 3).map(r => ({
      type: r.type,
      title: r.title || r.name,
      score: r.score?.toFixed(3)
    })))
    console.log('📋 Полные результаты Fuse.js:', fuseResults)
    if (fuseResults.length > 0) {
      console.log('📋 Детали первого результата:', {
        type: fuseResults[0].type,
        title: fuseResults[0].title,
        _id: fuseResults[0]._id,
        name: fuseResults[0].name
      })
    }
    }
    
    // Преобразуем результаты в формат SearchResult
    const searchResultsArray: SearchResult[] = fuseResults.map((item: any) => {
      let url = ''
      let typeLabel = ''
      
      switch (item.type) {
        case 'mkb':
          typeLabel = 'МКБ'
          url = `/codifier/${item.category?.url}?id=${item._id}`
          break
        case 'ls':
          typeLabel = 'Локальный статус'
          url = `/local-statuses/${item.category?.url}?id=${item._id}`
          break
        case 'algorithm':
          typeLabel = 'Алгоритм'
          url = `/algorithms/${item.section?.url}/${item.category?.url}/${item._id}`
          break
        case 'drug':
          typeLabel = 'Препарат'
          url = `/drugs?id=${item._id}`
          break
        case 'substation':
          typeLabel = 'Подстанция'
          url = `/substations?select=${encodeURIComponent(item.title)}`
          break
      }
      
      return {
        id: item._id,
        title: item.title || item.name,
        description: item.description || item.note || '',
        type: typeLabel,
        category: item.category?.name,
        url,
        codes: { 
          mkbCode: item.mkbCode, 
          stationCode: item.stationCode 
        },
        data: item,
        searchText: `${item.title} ${item.description} ${item.note}`.trim(),
        localis: item.localis || ''
      }
    })
    
    console.log('📋 Преобразованные результаты:', searchResultsArray.length, 'элементов')
    if (searchResultsArray.length > 0) {
      console.log('📋 Первые преобразованные результаты:', searchResultsArray.slice(0, 3).map(r => ({
        type: r.type,
        title: r.title,
        url: r.url
      })))
    }
    
    // Сортируем по релевантности (Fuse.js уже отсортировал, но можем дополнительно)
    const sortedResults = searchResultsArray.sort((a: SearchResult, b: SearchResult) => {
      const aScore = (a.data as any).score || 0
      const bScore = (b.data as any).score || 0
      return aScore - bScore // Меньший score = лучшая релевантность
    })
    
    
    console.log('📋 Отсортированные результаты:', sortedResults.length, 'элементов')
    if (sortedResults.length > 0) {
      console.log('📋 Первые отсортированные результаты:', sortedResults.slice(0, 3).map(r => ({
        type: r.type,
        title: r.title,
        url: r.url
      })))
    }
    
    globalSearchResults.value = sortedResults
    
    console.log('📋 Финальное состояние globalSearchResults.value:', globalSearchResults.value.length, 'элементов')
    if (globalSearchResults.value.length > 0) {
      console.log('📋 Первые элементы globalSearchResults.value:', globalSearchResults.value.slice(0, 3))
    }
    
    // Инициализируем мобильную логику для таблиц после обновления результатов
    nextTick(() => {
      setupMobileTableLogic()
      // Дополнительный вызов с задержкой для гарантии
      setTimeout(() => {
        setupMobileTableLogic()
      }, 100)
    })
    
  } catch (error) {
    console.error('❌ Ошибка поиска:', error)
    globalSearchResults.value = []
  } finally {
    isLoadingSearch.value = false
  }
}

// Утилиты
function getItemsArray(resp: any) { if (!resp) return []; if (Array.isArray(resp)) return resp; if (Array.isArray(resp.items)) return resp.items; return [] }

const { matchesNormalized } = useTextNormalization()
const normalizeSimple = (s: string) => (s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
const STOPWORDS_RU = new Set(['и','в','во','на','но','по','с','со','к','у','о','об','для','из','от','до','за','над','под','при'])
const russianStem = (word: string) => { let w = word; w = w.replace(/(ские|ский|ская|ское|ских|ским|скими)$/u, ''); w = w.replace(/(ые|ие|ой|ий|ая|ое|ее|ей|ых|их)$/u, ''); w = w.replace(/(ами|ями|ах|ях|ов|ев|ей|ью|ям|ам|ями)$/u, ''); w = w.replace(/(ы|и|а|я|у|ю|о|е)$/u, ''); if (w.length > 5) w = w.slice(0, w.length - 1); return w }

// Функция для ограничения текста до 5 строк
const truncateToLines = (text: string, maxLines: number = 5) => {
  if (!text) return ''
  const lines = text.split('\n')
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join('\n') + '...'
}

const truncateToApproximateLines = (text: string, maxLines: number = 5) => {
  if (!text) return ''
  
  // Примерно 60-70 символов на строку для текста размера text-sm
  const charsPerLine = 65
  const maxChars = maxLines * charsPerLine
  
  if (text.length <= maxChars) return text
  
  // Находим последний пробел перед лимитом, чтобы не обрезать слово
  let cutIndex = maxChars
  while (cutIndex > 0 && text[cutIndex] !== ' ' && text[cutIndex] !== '.' && text[cutIndex] !== ',') {
    cutIndex--
  }
  
  // Если не нашли подходящее место для обрезки, обрезаем по лимиту
  if (cutIndex < maxChars * 0.8) {
    cutIndex = maxChars
  }
  
  return text.slice(0, cutIndex) + '...'
}

const isMatch = (query: string, text: string) => {
  if (!query || !text) return false
  const textNorm = normalizeSimple(text)
  const queryNorm = normalizeSimple(query)
  
  // Точное совпадение
  if (matchesNormalized(query, text) || textNorm.includes(queryNorm)) return true
  
  // Поиск по словам - более строгий подход
  const tokens = queryNorm.split(' ').filter(t => t && t.length > 2 && !STOPWORDS_RU.has(t))
  if (tokens.length === 0) return false
  
  // Для коротких запросов (1-2 слова) требуем точного совпадения всех слов
  if (tokens.length <= 2) {
    return tokens.every(token => {
      const stem = russianStem(token)
      return textNorm.includes(token) || textNorm.includes(stem)
    })
  }
  
  // Для длинных запросов требуем совпадения большинства слов (не менее 70%)
  const matchedTokens = tokens.filter(token => {
    const stem = russianStem(token)
    return textNorm.includes(token) || textNorm.includes(stem)
  })
  
  return matchedTokens.length >= Math.ceil(tokens.length * 0.7)
}

// Работа с локальным хранилищем
const CHAT_STORAGE_KEY = 'smp-help-chat-history'
const MODE_STORAGE_KEY = 'smp-help-panel-mode'
const saveChatToStorage = () => { if (typeof window !== 'undefined') { try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages.value)) } catch (e) { console.error('Ошибка сохранения чата:', e) } } }
const loadChatFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        chatMessages.value = parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
        initializeMKBIcons()
        setTimeout(() => { initializeMKBIcons() }, 100)
      }
    } catch (error) { console.error('Ошибка загрузки чата:', error) }
  }
}
const saveModeToStorage = () => { if (typeof window !== 'undefined') { try { localStorage.setItem(MODE_STORAGE_KEY, 'chat') } catch (e) { console.error('Ошибка сохранения режима:', e) } } }
const loadModeFromStorage = () => { if (typeof window !== 'undefined') { try { /* режим всегда chat */ } catch (e) { console.error('Ошибка загрузки режима:', e) } } }

// Очистка чата (с подтверждением)
const clearChatHistory = () => {
  const msg: ChatMessage = { id: 'confirm-' + Date.now().toString(), text: 'Вы уверены, что хотите очистить чат?', isUser: false, timestamp: new Date(), confirmClear: true, isAI: true }
  chatMessages.value.push(msg)
  saveChatToStorage()
  scrollToBottom()
}
const removeMessage = (messageId: string) => { const idx = chatMessages.value.findIndex(m => m.id === messageId); if (idx !== -1) { chatMessages.value.splice(idx, 1); saveChatToStorage() } }
const confirmClearChat = (_messageId: string) => { chatMessages.value = []; saveChatToStorage() }

// Отправка сообщений
const scrollToBottom = () => { nextTick(() => { if (contentContainer.value) contentContainer.value.scrollTop = contentContainer.value.scrollHeight }) }
const formatTime = (date: Date) => date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const sendChatMessage = async () => {
  const text = currentChatMessage.value.trim()
  if (!text || isChatProcessing.value) return
  const userMessage: ChatMessage = { id: Date.now().toString(), text, isUser: true, timestamp: new Date() }
  chatMessages.value.push(userMessage)
  const originalQuestion = text
  currentChatMessage.value = ''
  saveChatToStorage()
  const loadingMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: 'Ищу информацию в базе данных...', isUser: false, timestamp: new Date(), isLoading: true }
  chatMessages.value.push(loadingMessage)
  scrollToBottom()
  isChatProcessing.value = true
  try {
    let response: any
    if (aiEnabledRef.value) {
      // Собираем краткую историю (последние 5 сообщений) с intent
      const hist = chatMessages.value.slice(-5).map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        text: m.text || '',
        intent: (m as any).intent || undefined
      }))
      response = await $fetch('/api/chatbot/ai-search', { method: 'POST', body: { query: text, history: hist } })
    } else {
      // Выполняем поиск в реальном времени
      await performSearch(text)
      
      const mkbAll = globalSearchResults.value.filter(r => r.type === 'МКБ')
      const lsAll = globalSearchResults.value.filter(r => r.type === 'Локальный статус')
      const algoAll = globalSearchResults.value.filter(r => r.type === 'Алгоритм')
      const drugAll = globalSearchResults.value.filter(r => r.type === 'Препарат')
      const substationAll = globalSearchResults.value.filter(r => r.type === 'Подстанция')
      
      // Если есть точное совпадение по коду станции или МКБ, показываем больше результатов
      const hasExactMatch = globalSearchResults.value.some(r => 
        r.codes?.stationCode === text || 
        r.codes?.mkbCode === text ||
        r.title?.toLowerCase().includes(text.toLowerCase())
      )
      
      const limit = hasExactMatch ? 10 : 3
      const limited = [...mkbAll.slice(0, limit), ...lsAll.slice(0, limit), ...algoAll.slice(0, limit), ...drugAll.slice(0, limit), ...substationAll.slice(0, limit)]
      response = { 
        message: (globalSearchResults.value.length === 0) ? 'Ничего не найдено. Попробуйте изменить формулировку, использовать часть слова или другой термин.' : 'Результаты поиска', 
        results: limited, 
        fullResults: { mkb: mkbAll, ls: lsAll, algo: algoAll, drug: drugAll, substation: substationAll } 
      }
    }
    const minDelay = 1500
    const startTime = Date.now()
    await new Promise(resolve => { const elapsed = Date.now() - startTime; const remainingDelay = Math.max(0, minDelay - elapsed); setTimeout(resolve, remainingDelay) })
    chatMessages.value.pop()
    const botId = Date.now().toString()
    const botResponse: ChatMessage = { id: botId, text: (response.message || ''), isUser: false, timestamp: new Date(), results: response.results || [], fullResults: response.fullResults || undefined, quickReplies: aiEnabledRef.value && (response as any).suggestions && (response as any).suggestions.length > 0 ? (response as any).suggestions : undefined, originalQuestion: originalQuestion, isAI: !!aiEnabledRef.value }
    if ((response as any).forceExpand) { (botResponse as any).forceExpand = (response as any).forceExpand }
    ;(botResponse as any).intent = (response as any).intent || null
    chatMessages.value.push(botResponse)
    // если сервер вернул пустой текст (follow-up), не запускаем печать
    const messageText = response.message || ''
    if (messageText) startTypewriter(botId, messageText)
    // If no quickReplies provided, infer from content
    if (!botResponse.quickReplies || botResponse.quickReplies.length === 0) {
      const qrs: string[] = []
      const firstDrug = (response.results || []).find((r:any) => r.type === 'drug')
      const data = firstDrug?.data || null
      if ((botResponse as any).intent && (botResponse as any).intent !== 'drug') {
        // секционные кнопки для не-препаратных intents
        if ((response.fullResults?.mkb || []).length) qrs.push('Показать кодификатор')
        if ((response.fullResults?.ls || []).length) qrs.push('Показать локальные статусы')
        if ((response.fullResults?.algo || []).length) qrs.push('Показать алгоритмы')
        if ((response.fullResults?.substation || []).length) qrs.push('Ближайшие подстанции')
        // исключить текущий intent
        const intent = (botResponse as any).intent
        botResponse.quickReplies = qrs.filter(q => {
          const l = q.toLowerCase()
          if (intent === 'mkb' && l.startsWith('диагноз')) return false
          if (intent === 'ls' && l.startsWith('локал')) return false
          if (intent === 'algorithm' && l.startsWith('алгорит')) return false
          if (intent === 'substation' && l.startsWith('подстанц')) return false
          return true
        })
      } else if (data) {
        const name = String(data.name || '')
        const hasDosages = (Array.isArray(data.doses) && data.doses.length)
          || (data.dosages && (Array.isArray(data.dosages?.doses) || Array.isArray(data.dosages?.mg_dosages?.doses) || Array.isArray(data.dosages?.variants)))
          || (Array.isArray(data.pediatricDose) && data.pediatricDose.length)
        if (hasDosages) qrs.push(`Дозировки ${name}`)
        if (Array.isArray(data.mechanism) && data.mechanism.length) qrs.push(`Механизм действия ${name}`)
        if (Array.isArray(data.contraindications) && data.contraindications.length) qrs.push(`Противопоказания ${name}`)
        if (Array.isArray(data.indications) && data.indications.length) qrs.push(`Показания ${name}`)
        if (Array.isArray(data.adverse) && data.adverse.length) qrs.push(`Побочные эффекты ${name}`)
        if (Array.isArray(data.interactions) && data.interactions.length) qrs.push(`Взаимодействия ${name}`)
        if (data.pharmacokinetics && (data.pharmacokinetics.onset || data.pharmacokinetics.duration || data.pharmacokinetics.half_life || data.pharmacokinetics.metabolism || data.pharmacokinetics.elimination)) qrs.push(`Фармакокинетика ${name}`)
        // Исключить текущую тему из кнопок
        const current = (response.message || '').toLowerCase()
        botResponse.quickReplies = qrs.filter(q => {
          const l = q.toLowerCase()
          if (current.includes('### показания') && l.startsWith('показания')) return false
          if (current.includes('### противопоказания') && l.startsWith('противопоказания')) return false
          if (current.includes('### побочные эффекты') && l.startsWith('побочные')) return false
          if (current.includes('### взаимодействия') && l.startsWith('взаимодейств')) return false
          if (current.includes('### фармакокинетика') && l.startsWith('фармакокинетика')) return false
          if (current.includes('### дозировки') && l.startsWith('дозировки')) return false
          if (current.includes('### механизм действия') && l.startsWith('механизм')) return false
          return true
        })
      }
    }
    initializeMKBIcons(); setTimeout(() => { initializeMKBIcons() }, 100)
    saveChatToStorage()
  } catch (error) {
    console.error('Ошибка чата:', error)
    chatMessages.value.pop()
    const errorMessage: ChatMessage = { id: (Date.now() + 2).toString(), text: 'Извините, произошла ошибка при поиске. Попробуйте еще раз.', isUser: false, timestamp: new Date() }
    chatMessages.value.push(errorMessage)
    saveChatToStorage()
  } finally {
    isChatProcessing.value = false
    scrollToBottom()
  }
}

const sendQuickMessage = (text: string) => { currentChatMessage.value = text; sendChatMessage() }
const handleQuickReply = async (reply: string, message: ChatMessage) => {
  if (reply === 'Ближайшие подстанции') {
    const substationResult = message.results?.find(result => result.type === 'substation')
    if (substationResult) {
      try {
        const nearbyData = await $fetch('/api/substations/nearby', { method: 'POST', body: { substationName: substationResult.title, maxDistance: 3000 } })
        const responseText = generateNearbySubstationsResponse(nearbyData)
        const newMessage: ChatMessage = { id: Date.now().toString(), text: responseText, isUser: false, timestamp: new Date(), results: [] }
        chatMessages.value.push(newMessage)
        setTimeout(() => { initializeMKBIcons() }, 100)
      } catch (error) {
        const errorMessage: ChatMessage = { id: Date.now().toString(), text: 'К сожалению, не удалось найти ближайшие подстанции. Попробуйте позже.', isUser: false, timestamp: new Date(), results: [] }
        chatMessages.value.push(errorMessage)
      }
    } else {
      sendQuickMessage(reply)
    }
  } else {
    // Спец-обработчики для кнопок «Показать ...»: добавляем контекст исходного вопроса
    const rq = (message as any)?.originalQuestion || ''
    if (reply === 'Показать алгоритмы') {
      const text = rq ? `Показать алгоритмы: ${rq}` : 'Показать алгоритмы'
      return sendQuickMessage(text)
    }
    if (reply === 'Показать локальные статусы') {
      const text = rq ? `Показать локальные статусы: ${rq}` : 'Показать локальные статусы'
      return sendQuickMessage(text)
    }
    if (reply === 'Показать кодификатор') {
      const text = rq ? `Показать кодификатор: ${rq}` : 'Показать кодификатор'
      return sendQuickMessage(text)
    }
    sendQuickMessage(reply)
  }
}

// Действия с результатами
const openMkbModal = (result: SearchResult) => {
  console.log('🔍 BottomSearchPanel: Открываем МКБ модалку:', result)
  
  if (result.url) {
    const url = result.url
    console.log('🔍 BottomSearchPanel: Используем готовый URL:', url)
    closePanel()
    navigateTo(url)
    return
  }
  
  const categoryUrl = (result as any).data?.category?.url
  const mkbId = (result as any).data?._id || (result as any).id?.replace('mkb-', '')
  
  console.log('🔍 BottomSearchPanel: Данные для навигации:', { categoryUrl, mkbId })
  
  if (categoryUrl && mkbId) {
    const target = `/codifier/${categoryUrl}?id=${mkbId}`
    console.log('🔍 BottomSearchPanel: Переходим на:', target)
    closePanel()
    navigateTo(target)
    return
  }
  
  console.log('❌ BottomSearchPanel: Не удалось определить URL для МКБ элемента')
}

const openLocalStatusModal = (result: SearchResult) => {
  console.log('🔍 BottomSearchPanel: Открываем LocalStatus модалку:', result)
  
  if (result.url) {
    const url = result.url
    console.log('🔍 BottomSearchPanel: Используем готовый URL LocalStatus:', url)
    closePanel()
    navigateTo(url)
    return
  }
  
  console.log('❌ BottomSearchPanel: Не удалось определить URL для LocalStatus элемента')
}

const openAlgorithmModal = (result: SearchResult) => {
  console.log('🔍 BottomSearchPanel: Открываем Algorithm модалку:', result)
  
  if (result.url) {
    const url = result.url
    console.log('🔍 BottomSearchPanel: Используем готовый URL Algorithm:', url)
    closePanel()
    navigateTo(url)
    return
  }
  
  const algorithmId = (result as any).data?._id || (result as any).id?.replace('algo-', '')
  const section = (result as any).data?.section?.url
  const category = (result as any).data?.category?.url
  
  console.log('🔍 BottomSearchPanel: Данные для навигации Algorithm:', { section, category, algorithmId })
  
  if (section && category && algorithmId) {
    const target = `/algorithms/${section}/${category}/${algorithmId}`
    console.log('🔍 BottomSearchPanel: Переходим на Algorithm:', target)
    closePanel()
    navigateTo(target)
    return
  }
  
  // Fallback - открываем общую страницу алгоритмов
  console.log('🔍 BottomSearchPanel: Fallback - переходим на общую страницу алгоритмов')
  closePanel()
  navigateTo('/algorithms')
}

const openDrugModal = (drugData: any) => {
  console.log('🔍 BottomSearchPanel: Открываем Drug модалку:', drugData)
  
  if (drugData?._id) {
    const url = `/drugs?id=${drugData._id}`
    console.log('🔍 BottomSearchPanel: Переходим на Drug:', url)
    closePanel()
    navigateTo(url)
    return
  }
  
  console.log('❌ BottomSearchPanel: Не удалось определить URL для Drug элемента')
}

const addDrugBookmark = async (drugData: any) => {
  if (!drugData?._id) return
  
  try {
    await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'drug',
        itemId: drugData._id,
        title: drugData.name || drugData.title,
        url: `/drugs?id=${drugData._id}`
      }
    })
    
    // Показываем уведомление об успехе
    const toast = useToast()
    toast.add({
      title: 'Добавлено в закладки',
      description: `${drugData.name || drugData.title} добавлен в закладки`,
      color: 'success'
    })
  } catch (error) {
    console.error('Ошибка добавления в закладки:', error)
    const toast = useToast()
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось добавить в закладки',
      color: 'error'
    })
  }
}

const openSubstationOnMap = (result: SearchResult) => {
  const name = encodeURIComponent(result.title)
  preloadAndNavigate(`/substations?select=${name}`, async () => { await $fetch('/api/substations').catch(() => {}) })
}

// Контекстное меню
const editingMessageId = ref<string | null>(null)
const editingText = ref('')
const expandedTables = ref<Record<string, boolean>>({})
const toggleTable = (tableId: string) => { 
  expandedTables.value[tableId] = !expandedTables.value[tableId] 
}
const isTableExpanded = (tableId: string) => !!expandedTables.value[tableId]
const startEditMessage = (messageId: string, currentText: string) => { editingMessageId.value = messageId; editingText.value = currentText }
const cancelEditMessage = () => { editingMessageId.value = null; editingText.value = '' }
const saveEditMessage = () => { if (editingMessageId.value && editingText.value.trim()) { const messageIndex = chatMessages.value.findIndex(msg => msg.id === editingMessageId.value); if (messageIndex !== -1) { chatMessages.value[messageIndex].text = editingText.value.trim(); saveChatToStorage() } } cancelEditMessage() }
const deleteMessage = (messageId: string) => {
  const messageIndex = chatMessages.value.findIndex(msg => msg.id === messageId)
  if (messageIndex !== -1) {
    const message = chatMessages.value[messageIndex]
    if (message.isUser && messageIndex + 1 < chatMessages.value.length) {
      const nextMessage = chatMessages.value[messageIndex + 1]
      if (!nextMessage.isUser) chatMessages.value.splice(messageIndex, 2)
      else chatMessages.value.splice(messageIndex, 1)
    } else {
      chatMessages.value.splice(messageIndex, 1)
    }
    saveChatToStorage()
  }
}
const getContextMenuItems = (message: any) => {
  const items: any[] = []
  if (message.isUser && !message.isLoading) { items.push([{ label: 'Редактировать', icon: 'i-lucide-edit', onSelect: () => startEditMessage(message.id, message.text) }]) }
  items.push([{ label: 'Копировать', icon: 'i-lucide-copy', onSelect: () => copyToClipboard(message.text) }])
  if (!message.isLoading) { items.push([{ label: 'Удалить', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => deleteMessage(message.id) }]) }
  return items
}

// Секции результатов в сообщении
const expandedSections = ref<Record<string, Record<string, boolean>>>({})
const getSectionAll = (message: any, section: 'mkb' | 'ls' | 'algo' | 'substation' | 'drug') => {
  const full = message.fullResults?.[section]
  if (full && Array.isArray(full)) return full
  if (!message.results) return []
  if (section === 'mkb') return message.results.filter((r: any) => r.type === 'МКБ' || r.type === 'mkb')
  if (section === 'ls') return message.results.filter((r: any) => r.type === 'Локальный статус' || r.type === 'local-status')
  if (section === 'algo') return message.results.filter((r: any) => r.type === 'Алгоритм' || r.type === 'algorithm')
  if (section === 'substation') return message.results.filter((r: any) => r.type === 'Подстанция' || r.type === 'substation')
  if (section === 'drug') return message.results.filter((r: any) => r.type === 'Препарат' || r.type === 'drug')
  return []
}
const isExpandedSection = (messageId: string, section: string) => !!expandedSections.value[messageId]?.[section]
const toggleSection = (messageId: string, section: string) => { if (!expandedSections.value[messageId]) expandedSections.value[messageId] = {}; expandedSections.value[messageId][section] = !expandedSections.value[messageId][section] }
const getSectionVisible = (message: any, section: 'mkb' | 'ls' | 'algo' | 'substation' | 'drug') => { const all = getSectionAll(message, section); return isExpandedSection(message.id, section) ? all : all.slice(0, 3) }

// Прелоад + навигация
const preloadAndNavigate = async (to: string, preloadFn: () => Promise<void>) => {
  try { 
    isPreloading.value = true
    await preloadFn()
    await navigateTo(to)
    closePanel()
  } finally { 
    isPreloading.value = false 
  }
}

// Slug секции алгоритма
function computeSectionSlug(source: any) {
  let s: string = ''
  if (typeof source === 'string') s = source
  else if (source && typeof source === 'object') s = String(source.slug || source.name || source.title || '')
  else s = String(source || '')
  s = s.toLowerCase()
  if (s.includes('онмп') || s === 'onmp') return 'onmp'
  if (s.includes('дет') || s === 'onmp-children' || s.includes('детские')) return 'onmp-children'
  if (s.includes('adults') || s.includes('взрос')) return 'adults'
  if (s.includes('pediatr') || s.includes('педиатр')) return 'pediatrics'
  return s || 'adults'
}

// Монтирование/демонтирование
onMounted(() => {
  loadChatFromStorage()
  loadModeFromStorage()
  // Инициализируем мобильную логику для таблиц
  setupMobileTableLogic()
})
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    lockScroll()
    nextTick(() => {
      if (chatInput.value) chatInput.value.focus()
      restorePanelScroll()
      try {
        const hasSaved = localStorage.getItem(getScrollKey()) !== null
        if (!hasSaved && chatMessages.value.length > 0 && contentContainer.value) {
          contentContainer.value.scrollTop = contentContainer.value.scrollHeight
        }
      } catch {}
    })
  } else {
    unlockScroll()
    savePanelScroll()
  }
})
onUnmounted(() => { unlockScroll() })

const isDetailsShown = (messageId: string) => {
  return expandedSections.value[messageId]?.details || false
}

const toggleDetails = (messageId: string) => {
  const current = expandedSections.value[messageId] || {}
  const next = { ...current, details: !current.details }
  expandedSections.value[messageId] = next
}

// отключено: детальные карточки открываются только через кнопки ИИ (forceExpand)

// Авто-раскрытие секции при приходе спец-ответа (forceExpand)
watch(chatMessages, (msgs) => {
  const last = msgs[msgs.length - 1] as any
  const force = last?.forceExpand as ('mkb'|'ls'|'algo'|'drug'|'substation'|null)
  if (force && last?.id) {
    // Включаем детали, но не раскрываем секцию: покажутся первые 3 карточки
    expandedSections.value[last.id] = { ...(expandedSections.value[last.id] || {}), details: true }
    try { const el = contentContainer.value; if (el) el.scrollTop = el.scrollHeight } catch {}
  }
}, { deep: true })

// Показ подробностей для AI-сообщений — реализовано через expandedSections
</script>

<style scoped>
/* Анимация появления/закрытия */
.bsp-slide-enter-from { transform: translateY(32px); opacity: 0.001; }
.bsp-slide-enter-active { transition: transform 280ms ease-out, opacity 200ms ease-out; }
.bsp-slide-leave-to { transform: translateY(32px); opacity: 0; }
.bsp-slide-leave-active { transition: transform 240ms ease-in, opacity 200ms ease-in; }

/* Тонкий скролл */
.panel-scroll::-webkit-scrollbar { width: 6px; }
.panel-scroll::-webkit-scrollbar-track { background: transparent; }
.panel-scroll::-webkit-scrollbar-thumb { background-color: rgba(100, 116, 139, 0.5); border-radius: 9999px; }
.panel-scroll { scrollbar-width: thin; scrollbar-color: rgba(100, 116, 139, 0.5) transparent; }

/* Стили для таблиц алгоритмов как на странице алгоритма */
:deep(table) {
  table-layout: fixed;
}

:deep(table td) {
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.5;
  text-align: left;
  white-space: normal;
  hyphens: auto;
  -webkit-hyphens: auto;
  -ms-hyphens: auto;
  -moz-hyphens: auto;
}

/* Обрезка текста в шапке таблицы на мобильной версии */
@media (max-width: 767px) {
  :deep(thead th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}

/* Стили для индикаторов точек в контейнере таблицы */
:deep([data-mobile-dots-container]) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

:deep([data-mobile-dots-container] span) {
  transition: background-color 200ms ease-in-out;
}

/* Внутренние border'ы между колонками таблиц алгоритмов (точно как на странице алгоритма) */
:deep([data-styled-table-wrapper] table thead tr th:first-child),
:deep([data-styled-table-wrapper] table tbody tr td:first-child) {
  border-right: 1px solid rgb(241 245 249);
}

.dark :deep([data-styled-table-wrapper] table thead tr th:first-child),
.dark :deep([data-styled-table-wrapper] table tbody tr td:first-child) {
  border-right-color: rgb(51 65 85);
}

:deep([data-styled-table-wrapper] table thead tr th:nth-child(2)),
:deep([data-styled-table-wrapper] table tbody tr td:nth-child(2)) {
  border-left: 1px solid rgb(241 245 249);
}

.dark :deep([data-styled-table-wrapper] table thead tr th:nth-child(2)),
.dark :deep([data-styled-table-wrapper] table tbody tr td:nth-child(2)) {
  border-left-color: rgb(51 65 85);
}

@media (min-width: 768px) {
  :deep([data-styled-table-wrapper] table thead tr th:nth-child(2)),
  :deep([data-styled-table-wrapper] table tbody tr td:nth-child(2)) {
    border-right: 1px solid rgb(241 245 249);
  }
  
  .dark :deep([data-styled-table-wrapper] table thead tr th:nth-child(2)),
  .dark :deep([data-styled-table-wrapper] table tbody tr td:nth-child(2)) {
    border-right-color: rgb(51 65 85);
  }
}

/* Темная тема для индикаторов */
.dark :deep([data-mobile-dots-container]) {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>

