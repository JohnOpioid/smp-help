import { defineEventHandler } from 'h3'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user: any = await requireUser(event)
  return {
    success: true,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city || '',
      substation: user.substation || '',
      role: user.role
    }
  }
})


