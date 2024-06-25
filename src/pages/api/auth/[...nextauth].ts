// When you are ready
// https://authjs.dev/getting-started/migrating-to-v5
import NextAuth from 'next-auth'
import { authOptions } from '~/server/auth'

export default NextAuth(authOptions)
