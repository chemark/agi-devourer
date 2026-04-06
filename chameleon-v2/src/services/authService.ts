import type { SessionState } from '../app/types'
import { readJson, writeJson } from './storage'

const AUTH_KEY = 'agi-v2-auth'

type LoginInput = {
  nickname: string
}

export const authService = {
  async getSession(): Promise<SessionState> {
    return readJson<SessionState>(AUTH_KEY, { status: 'guest' })
  },

  async loginWithWeChatMock(input: LoginInput): Promise<SessionState> {
    const session: SessionState = {
      status: 'member',
      user: {
        id: `user-${Date.now()}`,
        nickname: input.nickname.trim(),
        provider: 'wechat-mock',
      },
    }

    writeJson(AUTH_KEY, session)
    return session
  },

  async logout(): Promise<void> {
    writeJson(AUTH_KEY, { status: 'guest' })
  },
}
