<script setup lang="ts">
import { h } from 'vue'
import MKB from '~/server/models/MKB'
import '~/server/models/MKBCategory'
import connectDB from '~/server/utils/mongodb'

const route = useRoute()
const id = route.params.id as string

await connectDB()
const item = await MKB.findById(id).populate('category', 'name url').lean()

const labelColor = '#64748b'
</script>

<template>
  <div style="display:flex;flex-direction:column;width:100%;height:100%;background-color:#f8fafc;font-family:Roboto, system-ui, -apple-system, Segoe UI, sans-serif;">
    <!-- header -->
    <div style="display:flex;align-items:center;padding:24px 32px;border-bottom:1px solid #e2e8f0;gap:16px;">
      <div style="font-size:24px;font-weight:500;color:#62748E;">КОДИФИКАТОР</div>
    </div>

    <!-- content -->
    <div style="display:flex;flex-direction:column;flex:1;padding:24px 32px;gap:28px;">
      <!-- codes row -->
      <div style="display:flex;gap:28px;">
        <div style="display:flex;flex-direction:column;">
          <div :style="{fontSize:'14px',fontWeight:'500',color:labelColor,marginBottom:'4px'}">Код МКБ-10</div>
          <div style="font-size:28px;font-family:monospace;font-weight:600;color:#0f172a;">{{ item?.mkbCode || '—' }}</div>
        </div>
        <div style="display:flex;flex-direction:column;">
          <div :style="{fontSize:'14px',fontWeight:'500',color:labelColor,marginBottom:'4px'}">Код станции</div>
          <div style="font-size:28px;font-family:monospace;font-weight:600;color:#0f172a;">{{ item?.stationCode || '—' }}</div>
        </div>
      </div>

      <!-- name -->
      <div style="display:flex;flex-direction:column;">
        <div :style="{fontSize:'14px',fontWeight:'500',color:labelColor,marginBottom:'4px'}">Нозологическая форма</div>
        <div style="font-size:28px;font-weight:600;color:#0f172a;">{{ item?.name || '—' }}</div>
      </div>

      <!-- note -->
      <div v-if="item?.note" style="display:flex;flex-direction:column;">
        <div :style="{fontSize:'14px',fontWeight:'500',color:labelColor,marginBottom:'4px'}">Примечание</div>
        <div style="font-size:18px;color:#475569;line-height:1.5;">{{ item?.note }}</div>
      </div>

      <!-- category -->
      <div v-if="item?.category" style="display:flex;flex-direction:column;">
        <div :style="{fontSize:'14px',fontWeight:'500',color:labelColor,marginBottom:'4px'}">Категория</div>
        <div style="font-size:18px;color:#475569;">{{ (item as any)?.category?.name || '—' }}</div>
      </div>
    </div>

    <!-- footer -->
    <div style="display:flex;align-items:center;justify-content:center;padding:12px 16px;border-top:1px solid #e2e8f0;">
      <div style="font-size:14px;font-weight:400;color:#64748b;text-align:center;">Поделились кодом с сайта helpsmp.ru</div>
    </div>
  </div>
</template>
