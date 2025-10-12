<template>
  <div>
    <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              aria-label="Поделиться календарем смен" 
              class="rounded-md font-medium disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors text-xs gap-1.5 text-default hover:bg-elevated active:bg-elevated focus:outline-none focus-visible:bg-elevated hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent w-8 h-8 p-0 cursor-pointer inline-flex items-center justify-center"
              @click="generateCalendarPDF"
              title="Скачать календарь смен в PDF"
            >
            <UIcon name="i-heroicons:share" class="w-4 h-4" />
          </button>
          </div>
        <div class="flex items-center gap-3">
          <UButton icon="i-heroicons-chevron-left" variant="ghost" color="neutral" size="sm" class="w-8 h-8 p-0 cursor-pointer inline-flex items-center justify-center" @click="goPrevMonth" aria-label="Предыдущий месяц" />
          <button type="button"
                  class="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[140px] text-center h-8 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center"
                  @click="goToCurrentMonth"
                  aria-label="Текущий месяц">
            {{ monthLabel }}
          </button>
          <UButton icon="i-heroicons-chevron-right" variant="ghost" color="neutral" size="sm" class="w-8 h-8 p-0 cursor-pointer inline-flex items-center justify-center" @click="goNextMonth" aria-label="Следующий месяц" />
          <UButton icon="i-heroicons-squares-2x2" variant="ghost" color="neutral" size="sm" class="w-8 h-8 p-0 cursor-pointer inline-flex items-center justify-center" @click="templatesSlideoverOpen = true; fetchTemplates()" aria-label="Шаблоны" />
          <UButton 
            :variant="editMode ? 'solid' : 'ghost'" 
            :color="editMode ? 'primary' : 'neutral'" 
            size="sm" 
            class="w-8 h-8 p-0 cursor-pointer inline-flex items-center justify-center" 
            @click="toggleEditMode" 
            :aria-label="editMode ? 'Выйти из режима редактирования' : 'Режим редактирования'" 
          >
            <UIcon :name="editMode ? 'i-heroicons-check' : 'i-heroicons-pencil'" />
          </UButton>
        </div>
      </div>
      
      <!-- Селектор шаблона для режима редактирования -->
      <div v-if="editMode" class="p-4 border-b border-slate-100 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div class="flex-1 relative template-popover-container">
            <button
              type="button"
              class="max-w-xs w-full justify-start bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              @click="templatePopoverOpen = !templatePopoverOpen"
            >
              <template v-if="selectedTemplateForEdit">
                <span :style="{ backgroundColor: selectedTemplateForEdit.color || '#3B82F6' }" class="w-2 h-2 rounded-full"></span>
                {{ selectedTemplateForEdit.title || 'Без названия' }}
              </template>
              <template v-else>
                Выберите шаблон
              </template>
              <UIcon name="i-heroicons-chevron-down" class="ml-auto" />
            </button>
            
            <!-- Popover -->
            <div v-if="templatePopoverOpen" class="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg min-w-[220px]">
              <div class="p-2 space-y-1">
                <div v-if="templates.length === 0" class="text-center py-4 text-slate-500">
                  <UIcon name="i-heroicons-document-text" class="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p class="text-sm">Нет доступных шаблонов</p>
                </div>
                <div v-else>
                  <button
                    v-for="template in templates"
                    :key="template._id"
                    type="button"
                    class="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm flex items-center gap-2 cursor-pointer"
                    @click="selectedTemplateForEdit = template; templatePopoverOpen = false"
                  >
                    <span :style="{ backgroundColor: template.color || '#3B82F6' }" class="w-2.5 h-2.5 rounded-full"></span>
                    <span class="truncate">{{ template.title || 'Без названия' }} · {{ template.startTime?.slice(0,5) }} – {{ template.endTime?.slice(0,5) }}</span>
                  </button>
                  <div v-if="alternations.length" class="pt-2 mt-1 border-t border-slate-200 dark:border-slate-700">
                    <div class="text-[11px] text-slate-500 px-2 mb-1">Чередования</div>
                    <button v-for="a in alternations" :key="a._id" type="button" class="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm flex items-center gap-2 cursor-pointer" @click="alternationToApply = a; alternationRangeStart=''; alternationRangeEnd=''; templatePopoverOpen=false">
                      <UIcon name="i-heroicons-arrows-right-left" class="w-3.5 h-3.5 text-slate-500" />
                      <span class="truncate">{{ a.title || 'Без названия' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            @click="onEditPanelCancel"
          >
            Отмена
          </button>
        </div>
      </div>
      
      <div class="">
        <div v-if="templatesOpen" class="mb-3 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/40">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-slate-600 dark:text-slate-300">Шаблоны смен (быстрый доступ)</p>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-x-mark" class="cursor-pointer" @click="templatesOpen = false" />
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="t in templates" :key="t._id" class="inline-flex items-center gap-1">
              <UButton size="xs" variant="soft" color="neutral" class="cursor-pointer" @click="(newShiftStartTime = t.startTime, newShiftEndTime = t.endTime || '', openAddShift())">
                {{ (t.startTime || '').slice(0,5) }}<template v-if="t.endTime"> – {{ (t.endTime || '').slice(0,5) }}</template>
              </UButton>
              <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash" class="cursor-pointer" @click="deleteTemplate(t._id)" />
            </div>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-0">
          <div v-for="(day, i) in calendarDays" :key="day.key" :class="[
                'relative border-r border-b border-slate-200 dark:border-slate-700 pt-2 min-h-[110px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col',
                (i % 7 === 6) ? 'border-r-0' : '',
                (i >= calendarDays.length - 7) ? 'border-b-0' : '',
                editMode && selectedTemplateForEdit ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
              ]"
               @click="
                 alternationToApply
                   ? (alternationRangeStart ? (alternationRangeEnd ? null : (alternationRangeEnd = day.dateStr, applyAlternationRange()))
                      : (alternationRangeStart = day.dateStr))
                   : (editMode ? (day.shifts?.length ? toggleShiftOneClick(day) : (selectedTemplateForEdit ? addShiftOneClick(day) : (templatePopoverOpen = true))) : openAddShiftForDate(day.dateStr))
               "
               @mouseenter="alternationToApply && alternationRangeStart && !alternationRangeEnd ? (alternationHoverDate = day.dateStr) : null"
               @mouseleave="alternationToApply && alternationRangeStart && !alternationRangeEnd ? (alternationHoverDate = '') : null"
          >
            <!-- Маленькое число в углу, если есть смены -->
            <div class="flex items-start justify-between h-6 px-2">
              <span class="text-xs" :class="
                day.isToday
                  ? ((day.isWeekend || day.isHoliday) ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white')
                  : ((day.isWeekend || day.isHoliday) ? 'text-red-600 dark:text-red-400' : 'text-slate-500')
              ">{{ day.label }}</span>
              <!-- Индикатор режима редактирования -->
              <div class="flex items-center gap-1">
                <div v-if="editMode && selectedTemplateForEdit" class="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span v-if="day.shifts.length > 0"
                    class="text-base font-extrabold px-1.5 rounded leading-none"
                    :class="
                      day.outside
                        ? ((day.isWeekend || day.isHoliday) ? 'text-red-200 dark:text-red-800' : 'text-slate-200 dark:text-slate-800')
                        : ((day.isWeekend || day.isHoliday) ? 'text-red-300 dark:text-red-500' : (day.isToday ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-300'))
                    ">
                {{ day.dayNumber }}
              </span>
              <span v-else class="text-base font-extrabold px-1.5 rounded leading-none invisible"
                    :class="
                      day.outside
                        ? ((day.isWeekend || day.isHoliday) ? 'text-red-200 dark:text-red-800' : 'text-slate-200 dark:text-slate-800')
                        : ((day.isWeekend || day.isHoliday) ? 'text-red-300 dark:text-red-500' : 'text-slate-400 dark:text-slate-300')
                    ">00</span>
            </div>
            <!-- Выделение диапазона применения чередования -->
            <div
              v-if="alternationToApply && (alternationRangeStart || alternationRangeEnd || alternationHoverDate) &&
                     day.dateStr >= (alternationRangeStart || day.dateStr) &&
                     day.dateStr <= ((alternationRangeEnd || alternationHoverDate) || day.dateStr)"
              class="absolute inset-0 pointer-events-none rounded-sm"
              :class="alternationRangeEnd ? 'ring-2 ring-primary/40' : 'bg-blue-100/40 dark:bg-blue-900/20'"
            ></div>
            <!-- Большое число фоном, если пусто -->
            <div v-if="day.shifts.length === 0" class="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
              <span class="text-xl md:text-4xl font-bold"
                    :class="
                      (day.isToday)
                        ? ((day.isWeekend || day.isHoliday) ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white')
                        : (
                      day.outside
                        ? ((day.isWeekend || day.isHoliday) ? 'text-red-200 dark:text-red-800' : 'text-slate-200 dark:text-slate-800')
                        : ((day.isWeekend || day.isHoliday) ? 'text-red-300 dark:text-red-500' : 'text-slate-400 dark:text-slate-300')
                          )
                    ">
                {{ day.dayNumber }}
              </span>
            </div>
            <ul class="mt-2 space-y-1 flex-1">
              <li v-for="shift in day.shifts" :key="shift._id" class="px-2 py-1 text-center flex items-center justify-center" :class="{ 'h-full': day.shifts.length === 1 }"
                  :style="getShiftStyle(shift)">
                <!-- Desktop/tablet: в одну строку с тире -->
                <div class="hidden md:block truncate text-xs">
                  <template v-if="shift.title">
                    <div class="font-medium truncate mb-0.5">{{ shift.title }}</div>
                  </template>
                  <div>
                    {{ formatShiftTime(shift.startTime) }}<template v-if="shift.endTime"> – {{ formatShiftTime(shift.endTime) }}</template>
                  </div>
                </div>
                <!-- Mobile: в столбец без тире -->
                <div class="flex flex-col md:hidden leading-tight">
                  <span class="text-xs font-semibold">{{ formatShiftTime(shift.startTime) }}</span>
                  <span v-if="shift.endTime" class="text-xs">{{ formatShiftTime(shift.endTime) }}</span>
                </div>
              </li>
            </ul>
            <!-- Превью смены по чередованию: точка у нижнего края -->
            <div v-if="getAlternationPreviewFor(day.dateStr) && !alternationRangeEnd" class="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none">
              <span :style="getPreviewDotStyle(getAlternationPreviewFor(day.dateStr)?.color)" class="block w-2.5 h-2.5 rounded-full"></span>
            </div>
          </div>
        </div>
        <div class="py-4 flex items-center justify-center bg-slate-100 dark:bg-slate-700 ">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            Всего за месяц: <span class="font-semibold">{{ monthlyHours }}</span> ч
          </div>
        </div>
      </div>
      
      <!-- Правый сайдовер шаблонов -->
      <USlideover v-model:open="templatesSlideoverOpen" side="right" title="Шаблоны смен" description="Управление шаблонами" :dismissible="true" :ui="{ overlay: 'bg-slate-700/50', content: 'sm:max-w-sm', body: 'p-0', footer: 'p-4 border-t border-slate-200 dark:border-slate-700' }" @update:open="onTemplatesSlideoverToggle">
        <template #body>
          <div class="space-y-4 flex-1 overflow-y-auto sm:p-6 p-4">
            <!-- Вкладки: Смены / Чередование -->
            <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left">
              <button type="button"
                      class="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer"
                      :class="activeTemplatesTab==='templates' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                      @click="activeTemplatesTab='templates'; alternationOpen = false; templateEditorOpen = false">
                <UIcon name="i-heroicons:calendar-days" class="w-4 h-4 mr-2" /> Смены
              </button>
              <button type="button"
                      class="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer"
                      :class="activeTemplatesTab==='alternations' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                      @click="activeTemplatesTab='alternations'; templateEditorOpen = false; alternationOpen = false">
                <UIcon name="i-heroicons:arrows-right-left" class="w-4 h-4 mr-2" /> Чередование
              </button>
            </nav>
            <!-- Список чередований -->
            <div v-if="activeTemplatesTab==='alternations' && !alternationOpen">
              <div v-if="!alternations.length" class="p-8 text-center space-y-3">
                <UIcon name="i-heroicons-arrows-right-left" class="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
                <div class="text-base text-slate-600 dark:text-slate-300">Пока нет чередований</div>
            </div>
              <div v-else class="space-y-2">
                <div v-for="a in alternations" :key="a._id" class="group py-3 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer transition-colors" @click="openAlternationFromList(a)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{{ a.title || 'Без названия' }}</p>
                      <div class="mt-1 flex flex-wrap gap-1">
                        <div v-for="(d,idx) in (((a.days || []) as Array<any>).filter((x:any)=>x && (x.templateId || x.free)))" :key="idx" class="flex items-center justify-center">
                          <span v-if="d.templateId" :style="{ backgroundColor: (templates.find(t=>t._id===d.templateId)?.color) || '#3B82F6' }" class="w-2.5 h-2.5 rounded-full"></span>
                          <span v-else class="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash" class="cursor-pointer" @click.stop="deleteAlternation(a._id)"></UButton>
                  </div>
                </div>
              </div>
              
            </div>

            <!-- Форма чередования -->
            <div v-if="alternationOpen" class="p-4">
              <div class="mb-3">
                <UFormField label="Название" class="w-full">
                  <UInput v-model="alternationTitle" placeholder="Например: Два через два" size="xl" class="w-full" />
                </UFormField>
              </div>
              <div class="text-xs text-slate-500 mb-2">2 недели</div>
              <div class="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
                <div v-for="week in 2" :key="week" class="grid grid-cols-7">
                  <button
                    v-for="d in 7"
                    :key="(week-1)*7 + d"
                    type="button"
                    class="aspect-square flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                    @click="onAlternationCellClick((week-1)*7 + (d-1))"
                  >
                    <span v-if="alternationDays[(week-1)*7 + (d-1)] && alternationDays[(week-1)*7 + (d-1)].templateId" :style="{ backgroundColor: (templates.find(t=>t._id===alternationDays[(week-1)*7 + (d-1)].templateId)?.color) || '#3B82F6' }" class="w-4 h-4 rounded-full"></span>
                    <span v-else-if="alternationDays[(week-1)*7 + (d-1)] && alternationDays[(week-1)*7 + (d-1)].free" class="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span v-else class="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700"></span>
                  </button>
                </div>
              </div>
              <div class="mt-3">
                <div class="text-xs text-slate-500 mb-1">Шаблоны</div>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="t in templates" :key="t._id" type="button" class="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                           :class="{ 'ring-2 ring-primary': alternationSelectedTemplate?._id === t._id }"
                           @click="alternationSelectedTemplate = (alternationSelectedTemplate?._id === t._id ? null : t)">
                    <span :style="{ backgroundColor: (t as any).color || '#3B82F6' }" class="w-3 h-3 rounded-full flex-shrink-0"></span>
                    <div class="flex flex-col leading-tight min-w-0 text-left">
                      <span class="text-xs font-medium truncate">{{ t.title || 'Без названия' }}</span>
                      <span class="text-[11px] text-slate-500 truncate">{{ (t.startTime || '').slice(0,5) }}<template v-if="t.endTime"> – {{ (t.endTime || '').slice(0,5) }}</template></span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
              <div class="space-y-2" v-if="activeTemplatesTab==='templates' && !alternationOpen">
              <template v-if="(templates || []).length > 0">
                <div v-for="t in templates" :key="t._id" class="group py-3 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer transition-colors" @click="openTemplateEditor(t)">
                  <div class="flex items-center gap-3 min-w-0">
                    <span :style="{ backgroundColor: (t as any).color || '#3B82F6' }" class="w-2.5 h-2.5 rounded-full shrink-0"></span>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{{ t.title || 'Без названия' }}</p>
                  <p class="text-xs text-slate-500">{{ (t.startTime || '').slice(0,5) }}<template v-if="t.endTime"> – {{ (t.endTime || '').slice(0,5) }}</template></p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                  <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash" class="cursor-pointer" @click.stop="deleteTemplate(t._id)" />
                </div>
              </div>
              </template>
              <template v-else>
                <div class="p-8 text-center space-y-3">
                  <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
                  <div class="text-base text-slate-600 dark:text-slate-300">Пока нет шаблонов</div>
            </div>
              </template>
            </div>
              <div class="space-y-3" v-if="templateEditorOpen && activeTemplatesTab==='templates'">
              
              <div class="text-xs text-slate-500" v-if="templateForm.id">Редактирование шаблона</div>
              <div class="flex items-end gap-3">
                <UFormField label="Название" class="w-full">
                  <UInput v-model="templateForm.title" placeholder="Например: Сутки" size="xl" class="w-full" />
              </UFormField>
                <UPopover>
                  <UButton aria-label="Выбрать цвет" color="neutral" variant="outline" size="lg" class="shrink-0 w-10 h-10 p-0 rounded-md cursor-pointer inline-flex items-center justify-center">
                    <span :style="{ backgroundColor: templateForm.color || '#3B82F6' }" class="w-5 h-5 rounded-sm" />
                  </UButton>
                  <template #content>
                    <UColorPicker v-model="templateForm.color" class="p-2" />
                  </template>
                </UPopover>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Время начала" class="w-full">
                  <UPopover v-model:open="templateStartOpen" :content="{ side: 'bottom', align: 'start', sideOffset: 8 }" @update:open="(v:boolean)=>{ if (!v) applyTemplateStartTime() }">
                    <UInput v-model="templateForm.startTime" placeholder="3 октября" size="xl" readonly class="w-full cursor-pointer" />
                    <template #content>
                      <div class="p-4 w-[260px] select-none" @mousedown.prevent>
                        <div class="flex items-center justify-center gap-3">
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevHour(templateTempStartTime || templateForm.startTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTemplateTimeWheel('hours','start',$event)"
                                 @mousedown.prevent="onTemplateTimeDragStart('hours','start',$event)">
                              {{ getHours(templateTempStartTime || templateForm.startTime) }}
              </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextHour(templateTempStartTime || templateForm.startTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">часы</div>
                          </div>
                          <div class="text-[28px] font-extrabold">:</div>
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevMinute(templateTempStartTime || templateForm.startTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTemplateTimeWheel('minutes','start',$event)"
                                 @mousedown.prevent="onTemplateTimeDragStart('minutes','start',$event)">
                              {{ getMinutes(templateTempStartTime || templateForm.startTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextMinute(templateTempStartTime || templateForm.startTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">минуты</div>
                          </div>
            </div>
          </div>
        </template>
                  </UPopover>
                </UFormField>
                <UFormField label="Время окончания" class="w-full">
                  <UPopover v-model:open="templateEndOpen" :content="{ side: 'bottom', align: 'start', sideOffset: 8 }" @update:open="(v:boolean)=>{ if (!v) applyTemplateEndTime() }">
                    <UInput v-model="templateForm.endTime" placeholder="3 октября" size="xl" readonly class="w-full cursor-pointer" />
                    <template #content>
                      <div class="p-4 w-[260px] select-none" @mousedown.prevent>
                        <div class="flex items-center justify-center gap-3">
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevHour(templateTempEndTime || templateForm.endTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTemplateTimeWheel('hours','end',$event)"
                                 @mousedown.prevent="onTemplateTimeDragStart('hours','end',$event)">
                              {{ getHours(templateTempEndTime || templateForm.endTime) }}
            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextHour(templateTempEndTime || templateForm.endTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">часы</div>
                </div>
                          <div class="text-[28px] font-extrabold">:</div>
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevMinute(templateTempEndTime || templateForm.endTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTemplateTimeWheel('minutes','end',$event)"
                                 @mousedown.prevent="onTemplateTimeDragStart('minutes','end',$event)">
                              {{ getMinutes(templateTempEndTime || templateForm.endTime) }}
                </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextMinute(templateTempEndTime || templateForm.endTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">минуты</div>
              </div>
            </div>
          </div>
        </template>
                  </UPopover>
                </UFormField>
              </div>
      
            </div>
            
                </div>
        </template>
        <template #footer>
          <div v-if="alternationOpen" class="flex items-center justify-between gap-2 w-full">
            <UButton size="xl" variant="ghost" color="neutral" icon="i-heroicons-arrow-left" class="cursor-pointer w-10 h-10 p-0 inline-flex items-center justify-center" @click="alternationOpen = false" />
            <UButton size="xl" color="primary" class="cursor-pointer flex-1 justify-center" @click="saveAlternation">Сохранить</UButton>
                </div>
          <div v-else class="flex items-center justify-end gap-2 w-full">
            <template v-if="templateEditorOpen">
              <UButton size="xl" variant="ghost" color="neutral" icon="i-heroicons-arrow-left" class="cursor-pointer w-10 h-10 p-0 inline-flex items-center justify-center" @click="templateEditorOpen = false" />
              <UButton size="xl" color="primary" class="cursor-pointer flex-1 justify-center" @click="saveTemplate">Сохранить</UButton>
            </template>
            <template v-else>
              <UButton size="xl" color="primary" class="w-full justify-center cursor-pointer px-3 py-2" @click="activeTemplatesTab==='templates' ? startCreateTemplate() : openAlternationSetup()">Добавить</UButton>
            </template>
          </div>
        </template>
      </USlideover>
      
      
      <!-- Модалка добавления (desktop) -->
      <template v-if="!isMobile">
        <UModal v-model:open="addModalOpen" title="Новая смена" description="Выберите дату и время смены" :ui="{ overlay: 'bg-slate-700/50', wrapper: 'sm:max-w-md', content: 'sm:rounded-md rounded-t-md overflow-visible', body: 'p-4 sm:p-6 overflow-visible', close: 'cursor-pointer' }" modal overlay transition>
          <template #body>
            <div class="space-y-3">
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Время начала" class="w-full">
                  <UPopover v-model:open="startTimeOpen" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }" @update:open="(v:boolean) => { if (!v) applyStartTime() }">
                    <UInput v-model="startInputText" size="xl"
                            :placeholder="formatDateTimePlaceholder(newShiftStartDate || newShiftDate, newShiftStartTime)"
                            class="w-full"
                            @focus="onStartFocus"
                            @input="onStartTextInput"
                            @blur="onStartInputBlur"
                            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()" />
                    <template #content>
                      <div class="p-4 w-[260px] select-none" @mousedown.prevent>
                        <div class="flex items-center justify-center gap-3">
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevHour(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('hours','start',$event)"
                                 @mousedown.prevent="onTimeDragStart('hours','start',$event)"
                                 @touchstart.prevent="onTimeTouchStart('hours','start',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getHours(tempStartTime || newShiftStartTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextHour(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">часы</div>
                          </div>
                          <div class="text-[28px] font-extrabold">:</div>
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevMinute(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('minutes','start',$event)"
                                 @mousedown.prevent="onTimeDragStart('minutes','start',$event)"
                                 @touchstart.prevent="onTimeTouchStart('minutes','start',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getMinutes(tempStartTime || newShiftStartTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextMinute(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">минуты</div>
                          </div>
                        </div>
                        <div class="mt-4 grid grid-cols-2 gap-2">
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('start','08:00')">08:00</UButton>
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('start','20:00')">20:00</UButton>
                        </div>
                        
                      </div>
                    </template>
                  </UPopover>
              </UFormField>
                <UFormField label="Время окончания" class="w-full">
                  <UPopover v-model:open="endTimeOpen" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }" @update:open="(v:boolean) => { if (!v) applyEndTime() }">
                    <UInput v-model="endInputText" size="xl"
                            :placeholder="formatDateTimePlaceholder(newShiftEndDate || newShiftStartDate || newShiftDate, newShiftEndTime)"
                            class="w-full"
                            @focus="onEndFocus"
                            @input="onEndTextInput"
                            @blur="onEndInputBlur"
                            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()" />
                    <template #content>
                      <div class="p-4 w-[260px] select-none" @mousedown.prevent>
                        <div class="flex items-center justify-center gap-3">
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevHour(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('hours','end',$event)"
                                 @mousedown.prevent="onTimeDragStart('hours','end',$event)"
                                 @touchstart.prevent="onTimeTouchStart('hours','end',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getHours(tempEndTime || newShiftEndTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextHour(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">часы</div>
                          </div>
                          <div class="text-[28px] font-extrabold">:</div>
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevMinute(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('minutes','end',$event)"
                                 @mousedown.prevent="onTimeDragStart('minutes','end',$event)"
                                 @touchstart.prevent="onTimeTouchStart('minutes','end',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getMinutes(tempEndTime || newShiftEndTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextMinute(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">минуты</div>
                          </div>
                        </div>
                        <div class="mt-4 grid grid-cols-2 gap-2">
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('end','08:00')">08:00</UButton>
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('end','20:00')">20:00</UButton>
                        </div>
                        
                      </div>
                    </template>
                  </UPopover>
              </UFormField>
              </div>
              <p v-if="durationLabel" class="text-xs text-slate-500">Длительность: {{ durationLabel }}</p>
              <div class="mt-2">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-xs text-slate-500">Шаблоны смен</p>
                  <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-plus" class="cursor-pointer" @click="saveCurrentAsTemplate">Сохранить текущие</UButton>
                </div>
                <UPopover>
                  <UButton size="xl" variant="soft" color="neutral" class="w-full cursor-pointer">Выбрать из шаблона</UButton>
                  <template #content>
                    <div class="p-2 space-y-1">
                      <div v-if="!templates.length" class="text-xs text-slate-500">Нет шаблонов</div>
                      <div v-else class="space-y-1">
                        <button v-for="t in templates" :key="t._id" type="button" class="w-full text-left px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs flex items-center gap-2 cursor-pointer" @click="applyTemplate(t)">
                          <span :style="{ backgroundColor: (t as any).color || '#3B82F6' }" class="w-2.5 h-2.5 rounded-full"></span>
                          <span class="truncate"><template v-if="t.title">{{ t.title }} · </template>{{ (t.startTime || '').slice(0,5) }}<template v-if="t.endTime"> – {{ (t.endTime || '').slice(0,5) }}</template></span>
                        </button>
                  </div>
                </div>
                  </template>
                </UPopover>
              </div>
              
            </div>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton v-if="editingShiftId" color="error" variant="ghost" type="button" @click="deleteCurrentShift" class="cursor-pointer">Удалить</UButton>
              <UButton :color="canSaveShift ? 'primary' : 'neutral'" :disabled="!canSaveShift" @click="addShift" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </UModal>
      </template>

      <!-- BottomSheet добавления (mobile) -->
      <template v-else>
        <ClientOnly>
          <BottomSheet 
            v-model="addModalOpen" 
            title="Новая смена"
            @close="addModalOpen = false"
          >
            <div class="p-4 space-y-3">
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Время начала" class="w-full">
                  <UPopover v-model:open="startTimeOpen" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }" @update:open="(v:boolean) => { if (!v) applyStartTime() }">
                    <UInput v-model="startInputText" size="xl"
                            :placeholder="formatDateTimePlaceholder(newShiftStartDate || newShiftDate, newShiftStartTime)"
                            class="w-full"
                            @focus="onStartFocus"
                            @input="onStartTextInput"
                            @blur="onStartInputBlur"
                            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()" />
                    <template #content>
                      <div class="p-4 w-[260px] select-none" @mousedown.prevent>
                        <div class="flex items-center justify-center gap-3">
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevHour(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('hours','start',$event)"
                                 @mousedown.prevent="onTimeDragStart('hours','start',$event)"
                                 @touchstart.prevent="onTimeTouchStart('hours','start',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getHours(tempStartTime || newShiftStartTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextHour(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">часы</div>
                          </div>
                          <div class="text-[28px] font-extrabold">:</div>
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevMinute(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('minutes','start',$event)"
                                 @mousedown.prevent="onTimeDragStart('minutes','start',$event)"
                                 @touchstart.prevent="onTimeTouchStart('minutes','start',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getMinutes(tempStartTime || newShiftStartTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextMinute(tempStartTime || newShiftStartTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">минуты</div>
                          </div>
                        </div>
                        <div class="mt-4 grid grid-cols-2 gap-2">
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('start','08:00')">08:00</UButton>
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('start','20:00')">20:00</UButton>
                        </div>
                        
                      </div>
                    </template>
                  </UPopover>
              </UFormField>
                <UFormField label="Время окончания" class="w-full">
                  <UPopover v-model:open="endTimeOpen" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }" @update:open="(v:boolean) => { if (!v) applyEndTime() }">
                    <UInput v-model="endInputText" size="xl"
                            :placeholder="formatDateTimePlaceholder(newShiftEndDate || newShiftDate, newShiftEndTime)"
                            class="w-full"
                            @focus="onEndFocus"
                            @input="onEndTextInput"
                            @blur="onEndInputBlur"
                            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()" />
                    <template #content>
                      <div class="p-4 w-[260px] select-none" @mousedown.prevent>
                        <div class="flex items-center justify-center gap-3">
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevHour(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('hours','end',$event)"
                                 @mousedown.prevent="onTimeDragStart('hours','end',$event)"
                                 @touchstart.prevent="onTimeTouchStart('hours','end',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getHours(tempEndTime || newShiftEndTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextHour(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">часы</div>
                          </div>
                          <div class="text-[28px] font-extrabold">:</div>
                          <div class="flex-1 text-center">
                            <div class="text-xs text-slate-400 h-5 flex items-end justify-center">{{ getPrevMinute(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[34px] leading-none font-extrabold cursor-ns-resize"
                                 @wheel.prevent="onTimeWheel('minutes','end',$event)"
                                 @mousedown.prevent="onTimeDragStart('minutes','end',$event)"
                                 @touchstart.prevent="onTimeTouchStart('minutes','end',$event)"
                                 @touchmove.prevent="onTimeTouchMove($event)"
                                 @touchend.prevent="onTimeTouchEnd">
                              {{ getMinutes(tempEndTime || newShiftEndTime) }}
                            </div>
                            <div class="text-xs text-slate-400 h-5 flex items-start justify-center">{{ getNextMinute(tempEndTime || newShiftEndTime) }}</div>
                            <div class="text-[11px] text-slate-500 mt-1">минуты</div>
                          </div>
                        </div>
                        <div class="mt-4 grid grid-cols-2 gap-2">
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('end','08:00')">08:00</UButton>
                          <UButton size="sm" variant="soft" color="neutral" @click="setTimeQuick('end','20:00')">20:00</UButton>
                        </div>
                        
                      </div>
                    </template>
                  </UPopover>
              </UFormField>
              </div>
              <p v-if="durationLabel" class="text-xs text-slate-500">Длительность: {{ durationLabel }}</p>
              <div class="mt-2">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-xs text-slate-500">Шаблоны смен</p>
                  <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-plus" class="cursor-pointer" @click="saveCurrentAsTemplate">Сохранить текущие</UButton>
                </div>
                <UPopover>
                  <UButton size="xl" variant="soft" color="neutral" class="w-full cursor-pointer">Выбрать из шаблона</UButton>
                  <template #content>
                    <div class="p-2 space-y-1">
                      <div v-if="!templates.length" class="text-xs text-slate-500">Нет шаблонов</div>
                      <div v-else class="space-y-1">
                        <button v-for="t in templates" :key="t._id" type="button" class="w-full text-left px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs flex items-center gap-2 cursor-pointer" @click="applyTemplate(t)">
                          <span :style="{ backgroundColor: (t as any).color || '#3B82F6' }" class="w-2.5 h-2.5 rounded-full"></span>
                          <span class="truncate"><template v-if="t.title">{{ t.title }} · </template>{{ (t.startTime || '').slice(0,5) }}<template v-if="t.endTime"> – {{ (t.endTime || '').slice(0,5) }}</template></span>
                        </button>
                  </div>
                </div>
                  </template>
                </UPopover>
              </div>
              
              <div>
                <p class="text-xs text-slate-500 mb-1">Смены на выбранную дату</p>
                <div v-if="selectedDateShifts.length > 0" class="space-y-1">
                  <div v-for="s in selectedDateShifts" :key="s._id" class="flex items-center justify-between text-xs px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <span class="truncate">{{ s.title }}</span>
                    <UButton color="error" variant="ghost" size="xs" icon="i-heroicons-trash" class="cursor-pointer" @click="deleteShift(s._id)" />
                  </div>
                </div>
                <p v-else class="text-xs text-slate-400">Нет смен на эту дату</p>
              </div>
            </div>
            
            <!-- Футер с кнопками -->
            <template #footer>
              <div class="flex items-center justify-end gap-2 w-full">
                <UButton v-if="editingShiftId" color="error" variant="ghost" type="button" @click="deleteCurrentShift" class="cursor-pointer">Удалить</UButton>
                <UButton :color="canSaveShift ? 'primary' : 'neutral'" :disabled="!canSaveShift" @click="addShift" class="cursor-pointer">Сохранить</UButton>
              </div>
            </template>
          </BottomSheet>
        </ClientOnly>
      </template>
    </div>
  </div>
 </template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Смены', layout: 'profile' })

const { isMobile } = useIsMobile()
const addModalOpen = ref(false)
const selectedShiftColor = ref<string | undefined>(undefined)
const selectedShiftTitle = ref<string>('')

const today = new Date()
const startOfWeek = (d: Date) => {
  const nd = new Date(d)
  const day = nd.getDay() || 7
  nd.setDate(nd.getDate() - (day - 1))
  nd.setHours(0,0,0,0)
  return nd
}
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const firstOfMonth = computed(() => new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1))
const lastOfMonth = computed(() => new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0))
const start = computed(() => startOfWeek(new Date(firstOfMonth.value)))
const endOfWeek = (d: Date) => {
  const nd = new Date(d)
  const day = nd.getDay() || 7
  const add = 7 - day
  nd.setDate(nd.getDate() + add)
  nd.setHours(0,0,0,0)
  return nd
}
const end = computed(() => endOfWeek(new Date(lastOfMonth.value)))
const monthLabel = computed(() => currentMonth.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }))

const shifts = ref<any[]>([])

// Праздники РФ (основные), подставляем для текущего года
const holidays = computed(() => {
  const y = currentMonth.value.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toISO = (m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
  return new Set<string>([
    // Январь: 1-8
    ...Array.from({ length: 8 }, (_, i) => toISO(1, i + 1)),
    // 23 февраля
    toISO(2, 23),
    // 8 марта
    toISO(3, 8),
    // 1 мая
    toISO(5, 1),
    // 9 мая
    toISO(5, 9),
    // 12 июня
    toISO(6, 12),
    // 4 ноября
    toISO(11, 4)
  ])
})

const toLocalISO = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const calendarDays = computed(() => {
  const todayStr = toLocalISO(new Date())
  const days: any[] = []
  const startDate = new Date(start.value as any)
  const endDate = new Date(end.value as any)
  const total = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
  for (let i = 0; i < total; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = toLocalISO(d)
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short' })
    const inCurrentMonth = d.getFullYear() === currentMonth.value.getFullYear() && d.getMonth() === currentMonth.value.getMonth()
    const outside = !inCurrentMonth
    const dayNum = d.getDay() // 0-вс,6-сб
    const isWeekend = dayNum === 0 || dayNum === 6
    const isHoliday = holidays.value.has(dateStr)
    days.push({ key: dateStr, dateStr, label, outside, inCurrentMonth, isWeekend, isHoliday, isToday: dateStr === todayStr, dayNumber: d.getDate(), shifts: shifts.value.filter((s: any) => (s.date || '').slice(0,10) === dateStr) })
  }
  return days
})

const newShiftTitle = ref('')
const newShiftDate = ref('')
const newShiftStartTime = ref('')
const newShiftEndTime = ref('')
const editingShiftId = ref('') // ID редактируемой смены, пустая строка = новая смена
const startTimeOpen = ref(false)
const endTimeOpen = ref(false)
const startInputText = ref('')
const endInputText = ref('')
const tempStartTime = ref('')
const tempEndTime = ref('')
const templates = ref<any[]>([])
const templatesOpen = ref(false)
const templatesSlideoverOpen = ref(false)
const templateEditorOpen = ref(false)
const templateStartOpen = ref(false)
const templateEndOpen = ref(false)
const templateEndNextDay = ref(true)
const templateTempStartTime = ref('')
const templateTempEndTime = ref('')
const templateForm = reactive<{ id?: string; title: string; startTime: string; endTime: string; color?: string }>({ title: '', startTime: '08:00', endTime: '08:00', color: '#3B82F6' })

// Режим редактирования календаря
const editMode = ref(false)
const selectedTemplateForEdit = ref<any>(null)
const templatePopoverOpen = ref(false)
  const footerAddOpen = ref(false)

  // Чередование смен (2 недели)
  const activeTemplatesTab = ref<'templates' | 'alternations'>('templates')
  const alternationOpen = ref(false)
  const alternationTitle = ref('')
  const alternationDays = ref<Array<{ templateId?: string; free?: boolean }>>(Array.from({ length: 14 }, () => ({ templateId: undefined, free: undefined })))
  const alternationSelectedTemplate = ref<any>(null)
  const alternations = ref<Array<{ _id: string; title: string; days: Array<{ templateId?: string }> }>>([])
  const alternationToApply = ref<any>(null)
  const alternationRangeStart = ref('') // YYYY-MM-DD
  const alternationRangeEnd = ref('')   // YYYY-MM-DD
  const alternationLastCreatedIds = ref<string[]>([])
  const alternationHoverDate = ref('')   // YYYY-MM-DD, для предпросмотра

  function openAlternationSetup() {
    footerAddOpen.value = false
    activeTemplatesTab.value = 'alternations'
    alternationOpen.value = true
    alternationTitle.value = ''
    alternationDays.value = Array.from({ length: 14 }, () => ({ templateId: undefined, free: undefined }))
    alternationSelectedTemplate.value = null
    // Закрываем форму шаблонов, если была открыта
    templateEditorOpen.value = false
  }

  async function saveAlternation() {
    // Локальное сохранение (без бэкенда)
    try {
      const body = { title: alternationTitle.value || '', days: alternationDays.value }
      const res: any = await $fetch('/api/shifts/alternations', { method: 'POST', body })
      if (res?.success) {
        await fetchAlternations()
        alternationOpen.value = false
      }
    } catch {}
  }

  function onAlternationCellClick(idx: number) {
    const cell = alternationDays.value[idx]
    if (alternationSelectedTemplate.value) {
      // если та же самая смена уже стоит — снять её
      if (cell.templateId === alternationSelectedTemplate.value._id) {
        cell.templateId = undefined
        cell.free = undefined
      } else {
        cell.templateId = alternationSelectedTemplate.value._id
        cell.free = undefined
      }
    } else {
      // помечаем/снимаем «свободный день» по клику
      cell.templateId = undefined
      cell.free = !cell.free
    }
  }

  async function fetchAlternations() {
    try {
      const res: any = await $fetch('/api/shifts/alternations')
      if (res?.success) alternations.value = res.items || []
    } catch {}
  }

  function getAlternationFirstColor(a: any) {
    try {
      const first = (a?.days || []).find((d: any) => d && d.templateId)
      if (!first) return '#94a3b8'
      const t = templates.value.find((x: any) => x._id === first.templateId)
      return (t?.color || '#3B82F6')
    } catch { return '#94a3b8' }
  }

  function openAlternationFromList(a: any) {
    try {
      alternationTitle.value = a?.title || ''
      alternationDays.value = Array.isArray(a?.days) ? (a.days as any[]).map((d:any)=> (d ? { templateId: d.templateId, free: !!d.free } : { templateId: undefined, free: undefined })) : Array.from({ length: 14 }, () => ({ templateId: undefined, free: undefined }))
      // открыть форму редактирования внутри сайдовера
      activeTemplatesTab.value = 'alternations'
      alternationOpen.value = true
      alternationSelectedTemplate.value = null
      // сбросить состояние применения на календаре, если было
      alternationToApply.value = null
      alternationRangeStart.value = ''
      alternationRangeEnd.value = ''
      alternationHoverDate.value = ''
    } catch {
      alternationTitle.value = ''
      alternationDays.value = Array.from({ length: 14 }, () => ({ templateId: undefined, free: undefined }))
      activeTemplatesTab.value = 'alternations'
      alternationOpen.value = true
      alternationSelectedTemplate.value = null
      alternationToApply.value = null
      alternationRangeStart.value = ''
      alternationRangeEnd.value = ''
      alternationHoverDate.value = ''
    }
  }

  async function applyAlternationRange() {
    try {
      const a = alternationToApply.value
      const s = alternationRangeStart.value
      const e = alternationRangeEnd.value
      if (!a || !s || !e) return
      // генерируем массив дат от s до e включительно
      const start = new Date(s)
      const end = new Date(e)
      if (end.getTime() < start.getTime()) return
      // последовательность шаблона (только явные элементы: templateId или free)
      const sequence: any[] = (a.days || []).filter((d: any) => d && (d.templateId || d.free))
      if (sequence.length === 0) return
      const created: any[] = []
      const defaultColor = '#3B82F6'
      for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
        const stepIndex = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        const pattern = sequence[stepIndex % sequence.length] || {}
        if (pattern.free) continue // свободный день — пропускаем
        if (!pattern.templateId) continue
        const t = (templates.value as any[]).find(x => x._id === pattern.templateId)
        if (!t) continue
        const dateStr = toLocalISO(new Date(d))
        // создаём смену на дату по шаблону
        const body: any = {
          title: t.title || `${(t.startTime||'').slice(0,5)}${t.endTime? '–'+(t.endTime||'').slice(0,5) : ''}`,
          date: dateStr,
          startTime: t.startTime,
          endTime: t.endTime,
          color: t.color || defaultColor
        }
        created.push(body)
      }
      // последовательно создаём (можно батчем, но API по одному)
      alternationLastCreatedIds.value = []
      for (const body of created) {
        try { const res: any = await $fetch('/api/shifts', { method: 'POST', body }); if (res?.success && res.item?._id) alternationLastCreatedIds.value.push(res.item._id) } catch {}
      }
      await fetchShifts()
    } finally {
      // сбрасываем режим применения
      alternationToApply.value = null
      alternationRangeStart.value = ''
      alternationRangeEnd.value = ''
      alternationHoverDate.value = ''
    }
  }

  async function deleteAlternation(id: string) {
    try {
      const res: any = await $fetch(`/api/shifts/alternations/${id}`, { method: 'DELETE' })
      if (res?.success) await fetchAlternations()
    } catch {}
  }

  // Отмена панели редактирования: если были добавлены смены применением чередования, удалим их
  async function onEditPanelCancel() {
    try {
      if (alternationLastCreatedIds.value.length) {
        for (const id of alternationLastCreatedIds.value) {
          try { await $fetch(`/api/shifts/${id}`, { method: 'DELETE' }) } catch {}
        }
        alternationLastCreatedIds.value = []
        await fetchShifts()
      }
    } finally {
      editMode.value = false
      selectedTemplateForEdit.value = null
      templatePopoverOpen.value = false
      alternationRangeStart.value = ''
      alternationRangeEnd.value = ''
      alternationToApply.value = null
    }
  }
const newShiftStartDate = ref('') // YYYY-MM-DD, скрытая дата начала (из клика по календарю)
const newShiftEndDate = ref('')   // YYYY-MM-DD, скрытая дата конца (по умолчанию = дате начала/автоперенос)
// управление поповерами встроенное, явное состояние не используем

const timeOptions = computed(() => {
  const result: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      result.push(`${hh}:${mm}`)
    }
  }
  return result
})

const formatMonthLabel = (d: Date) => d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

const buildMonthGrid = (monthDate: Date) => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const s = startOfWeek(first)
  const eD = (() => {
    const nd = new Date(last)
    const day = nd.getDay() || 7
    const add = 7 - day
    nd.setDate(nd.getDate() + add)
    nd.setHours(0,0,0,0)
    return nd
  })()
  const days: { date: Date; dateStr: string; num: number; outside: boolean; weekend: boolean }[] = []
  const total = Math.round((eD.getTime() - s.getTime()) / (24*60*60*1000)) + 1
  for (let i = 0; i < total; i++) {
    const d = new Date(s)
    d.setDate(s.getDate() + i)
    const dateStr = toLocalISO(d)
    const outside = d.getMonth() !== monthDate.getMonth() || d.getFullYear() !== monthDate.getFullYear()
    const dayNum = d.getDay() // 0-вс
    const weekend = dayNum === 0 || dayNum === 6
    days.push({ date: d, dateStr, num: d.getDate(), outside, weekend })
  }
  return days
}

function buildDateFromParts(dateStr: string, timeStr: string): Date | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map((n) => Number(n))
  const [hh = 0 as any, mm = 0 as any] = (timeStr || '').split(':')
  const H = Number(hh || 0)
  const M = Number(mm || 0)
  const dt = new Date(y, (m - 1), d, H, M, 0, 0)
  return isNaN(dt.getTime()) ? null : dt
}

function formatTimeHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// Преобразует ISO-дату/время в локальный формат HH:MM
function formatISOTimeHHMM(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return formatTimeHHMM(d)
}

// Универсальный форматтер: поддерживает ISO и строки вида HH:MM
function formatShiftTime(value?: string): string {
  if (!value) return ''
  // ISO-время
  if (value.includes('T')) return formatISOTimeHHMM(value)
  // Уже HH:MM
  return (value || '').slice(0, 5)
}

const isEndBeforeStart = computed(() => {
  const baseDate = newShiftStartDate.value || newShiftDate.value
  const sd = buildDateFromParts(baseDate, newShiftStartTime.value)
  const ed = buildDateFromParts(newShiftEndDate.value || baseDate, newShiftEndTime.value)
  if (!sd || !ed) return false
  return ed.getTime() < sd.getTime()
})

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function pad2(n: number) { return String(n).padStart(2, '0') }
function parseTime(t: string) {
  const [h, m] = (t || '').split(':').map((x) => Number(x))
  return { h: clamp(isNaN(h) ? 0 : h, 0, 23), m: clamp(isNaN(m) ? 0 : m, 0, 59) }
}
function getHours(t: string) { return pad2(parseTime(t).h) }
function getMinutes(t: string) { return pad2(parseTime(t).m) }
function setTimeQuick(which: 'start' | 'end', t: string) {
  if (which === 'start') newShiftStartTime.value = t
  else newShiftEndTime.value = t
}

function getPrevHour(t: string) {
  const { h } = parseTime(t)
  return pad2((h + 23) % 24)
}
function getNextHour(t: string) {
  const { h } = parseTime(t)
  return pad2((h + 1) % 24)
}
function roundTo5(n: number) { return Math.round(n / 5) * 5 }
function getPrevMinute(t: string) {
  const { m } = parseTime(t)
  return pad2((roundTo5(m) + 60 - 5) % 60)
}
function getNextMinute(t: string) {
  const { m } = parseTime(t)
  return pad2((roundTo5(m) + 5) % 60)
}

let dragState: { which: 'start'|'end'; part: 'hours'|'minutes'; startY: number; startVal: number } | null = null
function onTimeDragStart(part: 'hours'|'minutes', which: 'start'|'end', e: MouseEvent) {
  const t = which === 'start' ? newShiftStartTime.value : newShiftEndTime.value
  const { h, m } = parseTime(t)
  dragState = { which, part, startY: e.clientY, startVal: part === 'hours' ? h : m }
  window.addEventListener('mousemove', onTimeDragMove)
  window.addEventListener('mouseup', onTimeDragEnd)
}
function onTimeDragMove(e: MouseEvent) {
  if (!dragState) return
  const delta = Math.round((dragState.startY - e.clientY) / 48) // медленнее: 48px на шаг
  const which = dragState.which
  const baseDateStr = which === 'start' ? (newShiftStartDate.value || newShiftDate.value) : (newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value)
  if (!baseDateStr) return
  const currentTime = which === 'start' ? (tempStartTime.value || newShiftStartTime.value) : (tempEndTime.value || newShiftEndTime.value)
  const { h, m } = parseTime(currentTime)
  let dt = new Date(baseDateStr)
  dt.setHours(h, m, 0, 0)
  if (dragState.part === 'hours') dt.setHours(dt.getHours() + (delta))
  else dt.setMinutes(dt.getMinutes() + (delta * 5))
  // Ограничение для конца: не меньше старта и не больше старта + 24ч
  if (which === 'end') {
    const startBase = newShiftStartDate.value || newShiftDate.value
    const sd = buildDateFromParts(startBase, newShiftStartTime.value)
    if (sd) {
      const max = new Date(sd)
      max.setHours(max.getHours() + 24)
      if (dt.getTime() < sd.getTime()) dt = sd
      if (dt.getTime() > max.getTime()) dt = max
    }
  }
  const nt = formatTimeHHMM(dt)
  if (which === 'start') { tempStartTime.value = nt; newShiftStartDate.value = toLocalISO(dt) } else { tempEndTime.value = nt; newShiftEndDate.value = toLocalISO(dt) }
}
function onTimeDragEnd() {
  window.removeEventListener('mousemove', onTimeDragMove)
  window.removeEventListener('mouseup', onTimeDragEnd)
  dragState = null
}

// Touch события для мобильных устройств
let touchState: { which: 'start'|'end'; part: 'hours'|'minutes'; startY: number; startVal: number; hasMoved: boolean } | null = null
function onTimeTouchStart(part: 'hours'|'minutes', which: 'start'|'end', e: TouchEvent) {
  const t = which === 'start' ? newShiftStartTime.value : newShiftEndTime.value
  const { h, m } = parseTime(t)
  touchState = { which, part, startY: e.touches[0].clientY, startVal: part === 'hours' ? h : m, hasMoved: false }
}
function onTimeTouchMove(e: TouchEvent) {
  if (!touchState) return
  const deltaY = touchState.startY - e.touches[0].clientY
  touchState.hasMoved = Math.abs(deltaY) > 10 // считаем что свайп начался после 10px движения
  ;(touchState as any).lastY = e.touches[0].clientY // сохраняем последнюю позицию
}
function onTimeTouchEnd() {
  if (!touchState || !touchState.hasMoved) {
    touchState = null
    return
  }
  
  const deltaY = touchState.startY - (touchState as any).lastY || 0
  const delta = deltaY > 0 ? 1 : -1 // короткий свайп: +1 или -1
  
  const which = touchState.which
  const baseDateStr = which === 'start' ? (newShiftStartDate.value || newShiftDate.value) : (newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value)
  if (!baseDateStr) return
  const currentTime = which === 'start' ? (tempStartTime.value || newShiftStartTime.value) : (tempEndTime.value || newShiftEndTime.value)
  const { h, m } = parseTime(currentTime)
  let dt = new Date(baseDateStr)
  dt.setHours(h, m, 0, 0)
  if (touchState.part === 'hours') dt.setHours(dt.getHours() + delta)
  else dt.setMinutes(dt.getMinutes() + (delta * 5))
  // Ограничение для конца: не меньше старта и не больше старта + 24ч
  if (which === 'end') {
    const startBase = newShiftStartDate.value || newShiftDate.value
    const sd = buildDateFromParts(startBase, newShiftStartTime.value)
    if (sd) {
      const max = new Date(sd)
      max.setHours(max.getHours() + 24)
      if (dt.getTime() < sd.getTime()) dt = sd
      if (dt.getTime() > max.getTime()) dt = max
    }
  }
  const nt = formatTimeHHMM(dt)
  if (which === 'start') { tempStartTime.value = nt; newShiftStartDate.value = toLocalISO(dt) } else { tempEndTime.value = nt; newShiftEndDate.value = toLocalISO(dt) }
  
  touchState = null
}
function onTimeWheel(part: 'hours'|'minutes', which: 'start'|'end', e: WheelEvent) {
  const baseDateStr = which === 'start' ? (newShiftStartDate.value || newShiftDate.value) : (newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value)
  if (!baseDateStr) return
  const t = which === 'start' ? (tempStartTime.value || newShiftStartTime.value) : (tempEndTime.value || newShiftEndTime.value)
  const { h, m } = parseTime(t)
  let dt = new Date(baseDateStr)
  dt.setHours(h, m, 0, 0)
  const step = e.deltaY > 0 ? -1 : 1
  if (part === 'hours') dt.setHours(dt.getHours() + step)
  else dt.setMinutes(dt.getMinutes() + (step * 5))
  // Ограничение для конца: не меньше старта и не больше старта + 24ч
  if (which === 'end') {
    const startBase = newShiftStartDate.value || newShiftDate.value
    const sd = buildDateFromParts(startBase, newShiftStartTime.value)
    if (sd) {
      const max = new Date(sd)
      max.setHours(max.getHours() + 24)
      if (dt.getTime() < sd.getTime()) dt = sd
      if (dt.getTime() > max.getTime()) dt = max
    }
  }
  const nt = formatTimeHHMM(dt)
  if (which === 'start') { tempStartTime.value = nt; newShiftStartDate.value = toLocalISO(dt) } else { tempEndTime.value = nt; newShiftEndDate.value = toLocalISO(dt) }
}

watch([newShiftStartDate, newShiftStartTime, () => newShiftDate.value], () => {
  // Автоподстановка конца смены: +12 часов от начала, если конец не задан или стал раньше начала
  const baseDate = newShiftStartDate.value || newShiftDate.value
  const sd = buildDateFromParts(baseDate, newShiftStartTime.value)
  if (!sd) return
  const ed = buildDateFromParts(newShiftEndDate.value || baseDate, newShiftEndTime.value)
  // Случай суточной смены: если время конца совпадает с временем начала и дата конца не задана, переносим на следующий день
  if (!newShiftEndDate.value && newShiftEndTime.value && newShiftStartTime.value && newShiftEndTime.value === newShiftStartTime.value) {
    const nd = new Date(sd)
    nd.setDate(nd.getDate() + 1)
    newShiftEndDate.value = toLocalISO(nd)
    return
  }
  if (!ed || ed.getTime() < sd.getTime()) {
    const nd = new Date(sd)
    nd.setHours(nd.getHours() + 12)
    // Если дата изменилась, переносим дату конца
    newShiftEndDate.value = toLocalISO(nd)
    newShiftEndTime.value = formatTimeHHMM(nd)
  }
})

// Следим за изменениями конца: если конец "раньше" начала, переносим конец на следующий день, сохраняя время
watch([newShiftEndDate, newShiftEndTime, newShiftStartDate, newShiftStartTime, () => newShiftDate.value], () => {
  const base = newShiftStartDate.value || newShiftDate.value
  const sd = buildDateFromParts(base, newShiftStartTime.value)
  if (!sd) return
  const endBase = newShiftEndDate.value || base
  const ed = buildDateFromParts(endBase, newShiftEndTime.value)
  if (!ed) return
  if (ed.getTime() <= sd.getTime()) {
    // переносим дату конца на следующий день от даты начала
    const nd = new Date(sd)
    nd.setDate(nd.getDate() + 1)
    newShiftEndDate.value = toLocalISO(nd)
  }
})

function applyStartTime() {
  const t = normalizeTimeInput(tempStartTime.value || newShiftStartTime.value)
  newShiftStartTime.value = t
  startInputText.value = formatDateTimePlaceholder(newShiftStartDate.value || newShiftDate.value, t)
  startTimeOpen.value = false
}

function applyEndTime() {
  const t = normalizeTimeInput(tempEndTime.value || newShiftEndTime.value)
  newShiftEndTime.value = t
  endInputText.value = formatDateTimePlaceholder(newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value, t)
  endTimeOpen.value = false
}

const canSaveShift = computed(() => {
  if (!(newShiftStartDate.value || newShiftDate.value)) return false
  if (!newShiftStartTime.value) return false
  // Разрешаем сохранение, даже если конец "раньше" начала — это будет трактоваться как следующий день
  return true
})

async function deleteCurrentShift() {
  if (!editingShiftId.value) return
  try {
    const res: any = await $fetch(`/api/shifts/${editingShiftId.value}`, { method: 'DELETE' })
    if (res?.success) {
      editingShiftId.value = ''
      addModalOpen.value = false
      await fetchShifts()
    }
  } catch {}
}

// Режим редактирования календаря
const toggleEditMode = async () => {
  editMode.value = !editMode.value
  if (!editMode.value) {
    selectedTemplateForEdit.value = null
    templatePopoverOpen.value = false
  } else {
    // Загружаем шаблоны при включении режима редактирования
    await fetchTemplates()
  }
}

// Закрытие popover при клике вне его области
const closeTemplatePopover = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.template-popover-container')) {
    templatePopoverOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeTemplatePopover)
})

onUnmounted(() => {
  document.removeEventListener('click', closeTemplatePopover)
})

const addShiftOneClick = async (day: any) => {
  if (!editMode.value || !selectedTemplateForEdit.value) return
  
  const template = selectedTemplateForEdit.value
  const dateStr = day.dateStr
  
  try {
    // Создаем даты с учетом времени из шаблона
    const startDateTime = new Date(`${dateStr}T${template.startTime}:00`)
    const endDateTime = new Date(`${dateStr}T${template.endTime}:00`)
    
    // Если время окончания раньше времени начала, добавляем день
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1)
    }
    
    const shiftData = {
      title: template.title || `${template.startTime} – ${template.endTime}`,
      date: dateStr, // Добавляем поле date для корректного отображения в календаре
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      color: template.color || '#3B82F6'
    }
    
    await $fetch('/api/shifts', {
      method: 'POST',
      body: shiftData
    })
    
    await fetchShifts()
  } catch (error) {
    console.error('Ошибка при добавлении смены:', error)
  }
}

// Переключатель: если на день уже есть смена — удаляем первую; иначе добавляем по выбранному шаблону
const toggleShiftOneClick = async (day: any) => {
  const shiftsOnDate = (day?.shifts && Array.isArray(day.shifts) ? day.shifts : shifts.value.filter((s: any) => (s.date || '').slice(0,10) === day.dateStr))
  if (shiftsOnDate.length > 0) {
    try {
      await deleteShift(shiftsOnDate[0]._id)
      return
    } catch {}
  }
  await addShiftOneClick(day)
}

async function fetchShifts() {
  const startISO = toLocalISO(start.value as any)
  const endISO = toLocalISO(end.value as any)
  const res: any = await $fetch('/api/shifts', { params: { start: startISO, end: endISO } })
  if (res?.success) shifts.value = (res.items || []).map((s: any) => ({ ...s, date: (s.date ? new Date(s.date).toISOString().slice(0,10) : '') }))
}

async function addShift() {
  // Используем дату из клика пользователя (newShiftDate) как дату смены
  const dateToSave = (newShiftStartDate.value || newShiftDate.value)
  if (!dateToSave || !newShiftStartTime.value) return
  const startTimeToSave = newShiftStartTime.value || undefined
  const endTimeToSave = newShiftEndTime.value || undefined
  const autoTitle = selectedShiftTitle.value || `${newShiftStartTime.value}${newShiftEndTime.value ? '–' + newShiftEndTime.value : ''}`
  const defaultColor = '#3B82F6'
  const res: any = await $fetch('/api/shifts', { method: 'POST', body: { title: autoTitle, date: dateToSave, startTime: startTimeToSave, endTime: endTimeToSave, color: (selectedShiftColor.value || defaultColor) } })
  if (res?.success) {
    newShiftDate.value = ''
    newShiftStartTime.value = ''
    newShiftEndTime.value = ''
    newShiftStartDate.value = ''
    newShiftEndDate.value = ''
    editingShiftId.value = ''
    addModalOpen.value = false
    selectedShiftColor.value = undefined
    selectedShiftTitle.value = ''
    await fetchShifts()
  }
}

function selectStartDate(dateStr: string) {
  console.log('[Shift] selectStartDate', { dateStr })
  newShiftStartDate.value = dateStr
  if (!newShiftStartTime.value) newShiftStartTime.value = '09:00'
}

function selectEndDate(dateStr: string) {
  console.log('[Shift] selectEndDate', { dateStr })
  newShiftEndDate.value = dateStr
  if (!newShiftEndTime.value && newShiftStartTime.value) newShiftEndTime.value = newShiftStartTime.value
}

function onStartTimeChange(v: string) {
  console.log('[Shift] startTime change', { v })
}

function onEndTimeChange(v: string) {
  console.log('[Shift] endTime change', { v })
}

function normalizeTimeInput(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 4)
  let h = 0, m = 0
  if (cleaned.length >= 3) {
    h = Number(cleaned.slice(0, 2))
    m = Number(cleaned.slice(2, 4))
  } else if (cleaned.length >= 1) {
    h = Number(cleaned)
  }
  h = clamp(isNaN(h) ? 0 : h, 0, 23)
  m = clamp(isNaN(m) ? 0 : m, 0, 59)
  return `${pad2(h)}:${pad2(m)}`
}

function onStartInputBlur() {
  // Закрываем без применения; инпут вернётся к плейсхолдеру
  startTimeOpen.value = false
}
function onEndInputBlur() {
  endTimeOpen.value = false
}

function onStartTextInput(e: Event) {
  startInputText.value = (e.target as HTMLInputElement)?.value || ''
}
function onEndTextInput(e: Event) {
  endInputText.value = (e.target as HTMLInputElement)?.value || ''
}

function onStartFocus() {
  startTimeOpen.value = true
  tempStartTime.value = newShiftStartTime.value || '09:00'
  startInputText.value = formatDateTimePlaceholder(newShiftStartDate.value || newShiftDate.value, tempStartTime.value)
}
function onEndFocus() {
  endTimeOpen.value = true
  tempEndTime.value = newShiftEndTime.value || (newShiftStartTime.value || '21:00')
  endInputText.value = formatDateTimePlaceholder(newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value, tempEndTime.value)
}

function formatDateTimePlaceholder(dateStr?: string, timeStr?: string) {
  if (!dateStr && !timeStr) return ''
  const d = dateStr ? new Date(dateStr) : null
  const datePart = d ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''
  const timePart = timeStr ? timeStr : ''
  return [datePart, timePart].filter(Boolean).join(', ')
}

const durationLabel = computed(() => {
  const base = newShiftStartDate.value || newShiftDate.value
  const sd = buildDateFromParts(base, newShiftStartTime.value)
  const ed = buildDateFromParts(newShiftEndDate.value || base, newShiftEndTime.value)
  if (!sd || !ed) return ''
  const diffMs = ed.getTime() - sd.getTime()
  if (diffMs <= 0) return ''
  const totalMinutes = Math.floor(diffMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`
  if (hours > 0) return `${hours} ч`
  return `${minutes} мин`
})

function hexToRgba(hex: string, alpha = 1) {
  try {
    const h = hex.replace('#', '')
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return hex
  }
}

function getShiftStyle(shift: any) {
  const raw = (shift?.color || '').trim()
  const color = raw || '#3B82F6'
  let bg = ''
  let text = color
  if (color.startsWith('#')) bg = hexToRgba(color, 0.12)
  else if (color.startsWith('rgb')) bg = color.replace(/rgba?\(([^)]+)\)/, 'rgba($1, 0.12)')
  else bg = color
  return { backgroundColor: bg, color: text }
}

const monthlyHours = computed(() => {
  const startMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  const endMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0)
  const sISO = toLocalISO(startMonth)
  const eISO = toLocalISO(endMonth)
  const items = shifts.value.filter((s: any) => {
    const d = (s.date || '').slice(0,10)
    return d >= sISO && d <= eISO
  })
  let totalMinutes = 0
  for (const s of items) {
    const startDateStr = (s.date || '').slice(0,10)
    const endDateStr = (s.endDate || startDateStr)

    // Универсально получаем даты начала/конца: поддержка ISO и HH:MM
    let sd: Date | null = null
    let ed: Date | null = null

    if (typeof s.startTime === 'string' && s.startTime.includes('T')) {
      const d = new Date(s.startTime)
      sd = isNaN(d.getTime()) ? null : d
    } else {
      sd = buildDateFromParts(startDateStr, s.startTime || '')
    }

    if (typeof s.endTime === 'string' && s.endTime.includes('T')) {
      const d = new Date(s.endTime)
      ed = isNaN(d.getTime()) ? null : d
    } else {
      ed = buildDateFromParts(endDateStr, s.endTime || '')
      // Для HH:MM: если конец не позже начала — переносим на следующий день
      if (sd && ed && s.endTime && s.startTime && s.endTime <= s.startTime) {
        ed = new Date(ed)
        ed.setDate(ed.getDate() + 1)
      }
    }

    if (!sd || !ed) continue
    const diffMs = ed.getTime() - sd.getTime()
    if (diffMs > 0) totalMinutes += Math.floor(diffMs / (60 * 1000))
  }
  return Math.round(totalMinutes / 60)
})

function goPrevMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
  fetchShifts()
}

function goNextMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
  fetchShifts()
}

function generateCalendarPDF() {
  // Создаем PDF календарь с сменами
  const month = new Date(currentMonth.value)
  const monthName = month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  
  // Получаем все смены для текущего месяца
  const monthShifts = shifts.value.filter(shift => {
    const shiftDate = new Date(shift.date)
    return shiftDate.getMonth() === month.getMonth() && 
           shiftDate.getFullYear() === month.getFullYear()
  })
  
  // Создаем HTML для PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Календарь смен - ${monthName}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #fff;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
        }
        .title { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .month { 
          font-size: 18px; 
          opacity: 0.9;
        }
        .calendar-grid { 
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .calendar-day { 
          position: relative;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          padding-top: 8px;
          min-height: 110px;
          display: flex;
          flex-direction: column;
        }
        .calendar-day:last-child {
          border-right: none;
        }
        .calendar-day:nth-child(7n) {
          border-right: none;
        }
        .calendar-day:nth-child(n+36) {
          border-bottom: none;
        }
        .day-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          height: 24px;
          padding: 0 8px;
        }
        .day-name {
          font-size: 12px;
          color: #64748b;
        }
        .day-name.weekend {
          color: #dc2626;
        }
        .day-number-small {
          font-size: 16px;
          font-weight: 800;
          padding: 0 6px;
          border-radius: 4px;
          line-height: 1;
          visibility: hidden;
          color: #cbd5e1;
        }
        .day-number-small.visible {
          visibility: visible;
        }
        .day-number-small.current-month {
          color: #475569;
        }
        .day-number-small.weekend {
          color: #fca5a5;
        }
        .day-number-small.today {
          color: #1e293b;
        }
        .day-number-big {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          pointer-events: none;
          font-size: 24px;
          font-weight: bold;
          color: #cbd5e1;
        }
        .day-number-big.current-month {
          color: #475569;
        }
        .day-number-big.weekend {
          color: #fca5a5;
        }
        .day-number-big.today {
          color: #1e293b;
        }
        .shifts-list {
          margin: 0;
          padding: 0;
          list-style: none;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .shift-item {
          padding: 4px 8px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background-color: rgba(59, 130, 246, 0.12) !important;
          color: rgb(59, 130, 246) !important;
          border-radius: 0;
          font-size: 12px;
          font-weight: 500;
        }
        .shift-time-desktop {
          font-size: 12px;
          display: block;
        }
        .shift-time-desktop .font-medium {
          font-weight: 600;
          margin-bottom: 2px;
        }
        .shift-time-mobile {
          display: none;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .header { margin-bottom: 20px; padding: 15px; }
          .title { font-size: 24px; }
          .month { font-size: 16px; }
          .calendar-grid { border: 3px solid #e2e8f0; }
          .calendar-day { min-height: 80px; }
          .day-number-big { font-size: 20px; }
          .shift-item {
            background-color: rgba(107, 114, 128, 0.15) !important;
            color: rgb(75, 85, 99) !important;
            border: none !important;
            font-size: 11px;
            padding: 3px 6px;
          }
          .shift-time-desktop {
            font-size: 11px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">📅 Календарь смен</div>
        <div class="month">${monthName}</div>
      </div>
      <div class="calendar-grid">
        ${generateCalendarHTML(month, monthShifts)}
      </div>
    </body>
    </html>
  `
  
  // Открываем в новом окне для печати/сохранения как PDF
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    
    // Автоматически открываем диалог печати
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

function generateCalendarHTML(month: Date, shifts: any[]) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const today = new Date()
  
  // Первый день месяца
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)
  
  // Начало недели (понедельник)
  const startDate = new Date(firstDay)
  const dayOfWeek = (firstDay.getDay() + 6) % 7 // Преобразуем воскресенье (0) в 6
  startDate.setDate(startDate.getDate() - dayOfWeek)
  
  let html = ''
  let currentDate = new Date(startDate)
  
  // Дни недели
  const dayNames = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
  
  // Генерируем 6 недель (42 дня)
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const isCurrentMonth = currentDate.getMonth() === monthIndex
      const isWeekend = day >= 5 // Суббота и воскресенье
      const isToday = currentDate.toDateString() === today.toDateString()
      const dayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date)
        return shiftDate.toDateString() === currentDate.toDateString()
      })
      
      const dayName = dayNames[day]
      const dayNumber = currentDate.getDate()
      
      // Определяем классы для стилизации
      const dayNameClass = isWeekend ? 'day-name weekend' : 'day-name'
      const dayNumberSmallClass = [
        'day-number-small',
        isCurrentMonth ? 'current-month' : '',
        isWeekend ? 'weekend' : '',
        isToday ? 'today' : '',
        dayShifts.length > 0 ? 'visible' : ''
      ].filter(Boolean).join(' ')
      
      const dayNumberBigClass = [
        'day-number-big',
        isCurrentMonth ? 'current-month' : '',
        isWeekend ? 'weekend' : '',
        isToday ? 'today' : ''
      ].filter(Boolean).join(' ')
      
      html += `<div class="calendar-day">`
      
      // Заголовок дня
      html += `<div class="day-header">`
      html += `<span class="${dayNameClass}">${dayName}</span>`
      html += `<span class="${dayNumberSmallClass}">${dayNumber.toString().padStart(2, '0')}</span>`
      html += `</div>`
      
      // Большое число фоном (если нет смен)
      if (dayShifts.length === 0) {
        html += `<div class="${dayNumberBigClass}">${dayNumber}</div>`
      }
      
      // Список смен
      if (dayShifts.length > 0) {
        html += `<ul class="shifts-list">`
        dayShifts.forEach(shift => {
          html += `<li class="shift-item" style="background-color: rgba(107, 114, 128, 0.15); color: rgb(75, 85, 99); padding: 4px 8px; border-radius: 0; font-size: 12px; font-weight: 500; border: none;">`
          html += `<div class="shift-time-desktop" style="font-size: 12px;">`
          // Если смена добавлена через чередование, показываем заголовок и время
          if (shift.title && shift.title !== 'Смена') {
            html += `<div style="font-weight: 600; margin-bottom: 2px;">${shift.title}</div>`
            html += `<div>${formatShiftTime(shift.startTime)} – ${formatShiftTime(shift.endTime)}</div>`
          } else {
            // Обычная смена - показываем только время
            html += `<div>${formatShiftTime(shift.startTime)} – ${formatShiftTime(shift.endTime)}</div>`
          }
          html += `</div>`
          html += `</li>`
        })
        html += `</ul>`
      }
      
      html += `</div>`
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  return html
}

function openAddShift() {
  addModalOpen.value = true
  if (isMobile.value) {
    // bottom sheet откроется по триггеру v-model
  }
  console.log('[Shift] openAddShift', {
    addModalOpen: addModalOpen.value,
    startPopoverOpen: 'n/a',
    endPopoverOpen: 'n/a'
  })
}

onMounted(() => { fetchShifts(); fetchTemplates(); fetchAlternations() })

function openAddShiftForDate(dateStr: string) {
  newShiftDate.value = dateStr
  
  // Находим смены на эту дату
  const shiftsOnDate = shifts.value.filter((s: any) => (s.date || '').slice(0,10) === dateStr)
  
  if (shiftsOnDate.length > 0) {
    // Если есть смены, заполняем поля данными из первой смены
    const firstShift = shiftsOnDate[0]
    editingShiftId.value = firstShift._id // Устанавливаем ID для редактирования
    const st = formatShiftTime(firstShift.startTime)
    const et = formatShiftTime(firstShift.endTime)
    newShiftStartTime.value = st || ''
    newShiftEndTime.value = et || ''
    selectedShiftColor.value = firstShift.color || undefined
    selectedShiftTitle.value = firstShift.title || ''
    
    // Заполняем инпуты для отображения
    if (st) {
      startInputText.value = formatDateTimePlaceholder(dateStr, st)
    }
    if (et) {
      // Проверяем, нужно ли увеличить дату на день на основе локальных HH:MM (включая равенство)
      const sd = buildDateFromParts(dateStr, st)
      const ed0 = buildDateFromParts(dateStr, et)
      let useDate = dateStr
      if (sd && ed0 && ed0.getTime() <= sd.getTime()) {
        const nextDay = new Date(dateStr)
        nextDay.setDate(nextDay.getDate() + 1)
        useDate = toLocalISO(nextDay)
      }
      endInputText.value = formatDateTimePlaceholder(useDate, et)
    }
  } else {
    // Если смен нет, очищаем поля
    editingShiftId.value = '' // Сбрасываем ID для новой смены
    newShiftStartTime.value = ''
    newShiftEndTime.value = ''
    selectedShiftColor.value = undefined
    startInputText.value = ''
    endInputText.value = ''
  }
  
  openAddShift()
  console.log('[Shift] openAddShiftForDate', { dateStr, shiftsOnDate: shiftsOnDate.length })
}

async function fetchTemplates() {
  try {
    const res: any = await $fetch('/api/shifts/templates')
    if (res?.success) templates.value = res.items || []
  } catch {}
}

async function saveCurrentAsTemplate() {
  try {
    const body: any = { startTime: newShiftStartTime.value || tempStartTime.value }
    if (newShiftEndTime.value || tempEndTime.value) body.endTime = (newShiftEndTime.value || tempEndTime.value)
    const res: any = await $fetch('/api/shifts/templates', { method: 'POST', body })
    if (res?.success) await fetchTemplates()
  } catch {}
}

function applyTemplate(t: any) {
  if (t?.startTime) {
    newShiftStartTime.value = t.startTime
    startInputText.value = formatDateTimePlaceholder(newShiftStartDate.value || newShiftDate.value, t.startTime)
  }
  if (t?.endTime) {
    newShiftEndTime.value = t.endTime
    // Если время окончания меньше или равно времени начала, то это смена на следующий день
    const isNextDay = t.endTime <= t.startTime
    const endDate = isNextDay ? 
      (newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value) : 
      (newShiftEndDate.value || newShiftStartDate.value || newShiftDate.value)
    
    // Если это следующий день, нужно увеличить дату на 1 день
    if (isNextDay && endDate) {
      const nextDay = new Date(endDate)
      nextDay.setDate(nextDay.getDate() + 1)
      endInputText.value = formatDateTimePlaceholder(toLocalISO(nextDay), t.endTime)
    } else {
      endInputText.value = formatDateTimePlaceholder(endDate, t.endTime)
    }
  }
  selectedShiftColor.value = (t as any)?.color || undefined
}

async function deleteTemplate(id: string) {
  try {
    const res: any = await $fetch(`/api/shifts/templates/${id}`, { method: 'DELETE' })
    if (res?.success) await fetchTemplates()
  } catch {}
}

function openTemplatesPanel() {
  templatesOpen.value = !templatesOpen.value
  if (templatesOpen.value) fetchTemplates()
}

function startCreateTemplate() {
  templateForm.id = undefined
  templateForm.title = ''
  templateForm.startTime = '08:00'
  templateForm.endTime = '08:00'
  templateForm.color = '#3B82F6'
  templateEndNextDay.value = true
  templateEditorOpen.value = true
}

function openTemplateEditor(t: any) {
  templateForm.id = t._id
  templateForm.title = t.title || ''
  templateForm.startTime = t.startTime || ''
  templateForm.endTime = t.endTime || ''
  templateForm.color = (t as any).color || '#3B82F6'
  templateEndNextDay.value = !!(templateForm.endTime && templateForm.startTime && (templateForm.endTime <= templateForm.startTime))
  templateEditorOpen.value = true
}

function applyTemplateStartTime() {
  const t = normalizeTimeInput(templateTempStartTime.value || templateForm.startTime)
  templateForm.startTime = t
  if (templateForm.endTime) templateEndNextDay.value = (templateForm.endTime <= templateForm.startTime)
}

function applyTemplateEndTime() {
  const t = normalizeTimeInput(templateTempEndTime.value || templateForm.endTime)
  templateForm.endTime = t
  templateEndNextDay.value = (templateForm.endTime <= templateForm.startTime)
}

let templateDragState: { which: 'start'|'end'; part: 'hours'|'minutes'; startY: number; startVal: number } | null = null
function onTemplateTimeDragStart(part: 'hours'|'minutes', which: 'start'|'end', e: MouseEvent) {
  const t = which === 'start' ? (templateTempStartTime.value || templateForm.startTime) : (templateTempEndTime.value || templateForm.endTime)
  const { h, m } = parseTime(t)
  templateDragState = { which, part, startY: e.clientY, startVal: part === 'hours' ? h : m }
  window.addEventListener('mousemove', onTemplateTimeDragMove)
  window.addEventListener('mouseup', onTemplateTimeDragEnd)
}
function onTemplateTimeDragMove(e: MouseEvent) {
  if (!templateDragState) return
  const delta = Math.round((templateDragState.startY - e.clientY) / 16)
  const base = new Date('1970-01-01T00:00:00')
  const startRef = templateTempStartTime.value || templateForm.startTime
  const { h: sh, m: sm } = parseTime(startRef)
  const dtStart = new Date(base)
  dtStart.setHours(sh, sm, 0, 0)

  const currentRef = templateDragState.which === 'start' ? (templateTempStartTime.value || templateForm.startTime) : (templateTempEndTime.value || templateForm.endTime)
  const { h, m } = parseTime(currentRef)
  let dt = new Date(base)
  dt.setHours(h, m, 0, 0)
  if (templateDragState.part === 'hours') dt.setHours(dt.getHours() + delta)
  else dt.setMinutes(dt.getMinutes() + (delta * 5))

  if (templateDragState.which === 'end') {
    if (dt.getTime() <= dtStart.getTime()) dt.setDate(dt.getDate() + 1)
    const max = new Date(dtStart)
    max.setHours(max.getHours() + 24)
    if (dt.getTime() > max.getTime()) dt = max
    templateEndNextDay.value = dt.getDate() > dtStart.getDate()
    const nt = formatTimeHHMM(dt)
    templateTempEndTime.value = nt
  } else {
    const nt = formatTimeHHMM(dt)
    templateTempStartTime.value = nt
    const endRef = templateTempEndTime.value || templateForm.endTime
    if (endRef) {
      const { h: eh, m: em } = parseTime(endRef)
      const dtEnd = new Date(base)
      dtEnd.setHours(eh, em, 0, 0)
      if (dtEnd.getTime() <= dt.getTime()) templateEndNextDay.value = true
      else templateEndNextDay.value = false
    }
  }
  // no-op here; selection handled elsewhere
}
function onTemplateTimeDragEnd() {
  window.removeEventListener('mousemove', onTemplateTimeDragMove)
  window.removeEventListener('mouseup', onTemplateTimeDragEnd)
  templateDragState = null
}
function onTemplateTimeWheel(part: 'hours'|'minutes', which: 'start'|'end', e: WheelEvent) {
  const base = new Date('1970-01-01T00:00:00')
  const startRef = templateTempStartTime.value || templateForm.startTime
  const { h: sh, m: sm } = parseTime(startRef)
  const dtStart = new Date(base)
  dtStart.setHours(sh, sm, 0, 0)

  const t = which === 'start' ? (templateTempStartTime.value || templateForm.startTime) : (templateTempEndTime.value || templateForm.endTime)
  const { h, m } = parseTime(t)
  let dt = new Date(base)
  dt.setHours(h, m, 0, 0)
  const step = e.deltaY > 0 ? -1 : 1
  if (part === 'hours') dt.setHours(dt.getHours() + step)
  else dt.setMinutes(dt.getMinutes() + (step * 5))

  if (which === 'end') {
    if (dt.getTime() <= dtStart.getTime()) dt.setDate(dt.getDate() + 1)
    const max = new Date(dtStart)
    max.setHours(max.getHours() + 24)
    if (dt.getTime() > max.getTime()) dt = max
    templateEndNextDay.value = dt.getDate() > dtStart.getDate()
    const nt = formatTimeHHMM(dt)
    templateTempEndTime.value = nt
  } else {
    const nt = formatTimeHHMM(dt)
    templateTempStartTime.value = nt
    const endRef = templateTempEndTime.value || templateForm.endTime
    if (endRef) {
      const { h: eh, m: em } = parseTime(endRef)
      const dtEnd = new Date(base)
      dtEnd.setHours(eh, em, 0, 0)
      if (dtEnd.getTime() <= dt.getTime()) templateEndNextDay.value = true
      else templateEndNextDay.value = false
    }
  }
  // Применяем цвет и название из выбранного шаблона (если есть)
  try {
    const anyT: any = t
    if (anyT && anyT.color) selectedShiftColor.value = anyT.color
    selectedShiftTitle.value = (anyT && anyT.title) ? anyT.title : ''
  } catch {}
}

async function saveTemplate() {
  try {
    if (templateForm.id) {
      const res: any = await $fetch(`/api/shifts/templates/${templateForm.id}`, { method: 'PATCH', body: { title: templateForm.title, startTime: templateForm.startTime, endTime: templateForm.endTime || undefined, color: templateForm.color || undefined } })
      if (res?.success) { templateEditorOpen.value = false; await fetchTemplates() }
    } else {
      const res: any = await $fetch('/api/shifts/templates', { method: 'POST', body: { title: templateForm.title, startTime: templateForm.startTime, endTime: templateForm.endTime || undefined, color: templateForm.color || undefined } })
      if (res?.success) { templateEditorOpen.value = false; await fetchTemplates() }
    }
  } catch {}
}

async function onBottomTemplateButtonClick() {
  if (!templateEditorOpen.value) {
    startCreateTemplate()
    return
  }
  if (!templateForm.startTime) return
  await saveTemplate()
}

function resetTemplateForm() {
  templateForm.id = undefined
  templateForm.title = ''
  templateForm.startTime = '08:00'
  templateForm.endTime = '08:00'
  templateForm.color = '#3B82F6'
  templateEndNextDay.value = true
}

function onTemplatesSlideoverToggle(open: boolean) {
  if (!open) {
    templateEditorOpen.value = false
      alternationOpen.value = false
    templateStartOpen.value = false
    templateEndOpen.value = false
    templateTempStartTime.value = ''
    templateTempEndTime.value = ''
    resetTemplateForm()
  }
}


function goToCurrentMonth() {
  const now = new Date()
  currentMonth.value = new Date(now.getFullYear(), now.getMonth(), 1)
  fetchShifts()
}

const selectedDateShifts = computed(() => {
  const ds = (newShiftStartDate.value || newShiftDate.value || '').slice(0,10)
  if (!ds) return []
  return shifts.value.filter((s: any) => (s.date || '').slice(0,10) === ds)
})

async function deleteShift(id: string) {
  try {
    const res: any = await $fetch(`/api/shifts/${id}` , { method: 'DELETE' })
    if (res?.success) {
      await fetchShifts()
    }
  } catch {}
}

function getAlternationPreviewFor(dateStr: string): { start: string; end?: string; title?: string; color?: string } | null {
  try {
    if (!alternationToApply.value || !alternationRangeStart.value || alternationRangeEnd.value) return null
    const hover = alternationHoverDate.value || alternationRangeStart.value
    const startStr = alternationRangeStart.value
    const start = new Date(startStr)
    const end = new Date(hover)
    const cur = new Date(dateStr)
    const min = new Date(Math.min(start.getTime(), end.getTime()))
    const max = new Date(Math.max(start.getTime(), end.getTime()))
    if (cur.getTime() < min.getTime() || cur.getTime() > max.getTime()) return null

    // последовательность только из явных элементов
    const seq = (alternationToApply.value.days || []).filter((d: any) => d && (d.templateId || d.free))
    if (!seq.length) return null
    const dayMs = 24 * 60 * 60 * 1000
    const offset = Math.floor((cur.getTime() - start.getTime()) / dayMs)
    const idx = ((offset % seq.length) + seq.length) % seq.length
    const pattern = seq[idx]
    if (pattern.free) return null
    const t = (templates.value as any[]).find(x => x._id === pattern.templateId)
    if (!t) return null
    const title = t.title || undefined
    const color = t.color || '#3B82F6'
    const startTime = (t.startTime || '').slice(0, 5)
    const endTime = (t.endTime || '').slice(0, 5)
    return { start: startTime, end: endTime || undefined, title, color }
  } catch {
    return null
  }
}

function getPreviewStyle(color?: string) {
  const c = (color || '#3B82F6').trim()
  try {
    if (c.startsWith('#')) return { backgroundColor: hexToRgba(c, 0.08), color: c, borderColor: c }
    if (c.startsWith('rgb')) return { backgroundColor: c.replace(/rgba?\(([^)]+)\)/, 'rgba($1, 0.08)'), color: c, borderColor: c }
    return { backgroundColor: c, color: c }
  } catch { return { } }
}

function getPreviewDotStyle(color?: string) {
  const c = (color || '#3B82F6').trim()
  try {
    if (c.startsWith('#')) return { backgroundColor: c }
    if (c.startsWith('rgb')) return { backgroundColor: c }
    return { backgroundColor: c }
  } catch { return {} }
}
</script>