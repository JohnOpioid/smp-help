import { defineEventHandler, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  // Стереть JWT cookie
  setCookie(event, 'token', '', {
    httpOnly: false, // Должно соответствовать настройкам при создании
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
  return { success: true }
})


