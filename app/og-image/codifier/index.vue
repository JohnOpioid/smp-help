<script setup lang="ts">
const headers = useRequestHeaders()
const host = (headers.host as string) || 'localhost:3000'
const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
const baseUrl = `${protocol}://${host}`
const logoUrl = `${baseUrl}/logo.svg`
const siteName = 'Справочник СМП'
const siteDescription = 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.'
</script>

<template>
  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;width:100%;height:100%;background-color:#f8fafc;font-family:Roboto, system-ui, -apple-system, Segoe UI, sans-serif;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:18px;padding:32px;text-align:center;max-width:90%;">
      <img :src="logoUrl" alt="Логотип" style="width:96px;height:96px;object-fit:contain;filter:grayscale(0.1) contrast(1.05);" />
      <div style="font-size:36px;line-height:1.2;font-weight:700;color:#0f172a;">{{ siteName }}</div>
      <div style="font-size:20px;line-height:1.5;font-weight:400;color:#475569;max-width:800px;">{{ siteDescription }}</div>
    </div>
  </div>
</template>
