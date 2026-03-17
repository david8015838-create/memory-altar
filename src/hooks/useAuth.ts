// ============================================================
// useAuth - 空間密碼驗證
// ============================================================

import { useState, useEffect } from 'react'
import { hashPassword, getSpace, createSpace } from '../lib/supabase'

const SESSION_KEY = 'memory-altar-session'

interface Session { spaceId: string; passwordHash: string }

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated'

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [spaceId, setSpaceId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // 啟動時嘗試從 localStorage 還原 session，並向 Supabase 驗證空間仍存在
  useEffect(() => {
    async function restore() {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        let session: Session | null = null
        try { session = JSON.parse(raw) } catch { /* invalid JSON */ }
        if (session) {
          // 立即顯示內容（樂觀登入）：不等 Supabase 驗證，先讓畫面出來
          // 避免 iOS PWA 從背景返回時出現空白畫面
          setSpaceId(session.spaceId)
          setStatus('authenticated')

          // 背景驗證：確認空間仍有效
          try {
            const space = await getSpace(session.spaceId)
            if (!space || space.password_hash !== session.passwordHash) {
              // 空間已刪除或密碼不符 → 登出
              localStorage.removeItem(SESSION_KEY)
              setSpaceId('')
              setStatus('unauthenticated')
            }
            // 驗證通過 → 維持已登入狀態
          } catch {
            // 網路錯誤：維持樂觀登入（已在上面設定）
          }
          return
        }
      }
      setStatus('unauthenticated')
    }
    restore()
  }, [])

  /** 登入現有空間 */
  const login = async (inputSpaceId: string, password: string) => {
    setError('')
    if (!inputSpaceId.trim() || !password.trim()) {
      setError('請輸入空間 ID 和密碼')
      return
    }

    const hash = await hashPassword(password)
    const space = await getSpace(inputSpaceId.trim())

    if (!space) {
      setError('找不到此空間，請確認 ID 是否正確')
      return
    }
    if (space.password_hash !== hash) {
      setError('密碼錯誤')
      return
    }

    const session: Session = { spaceId: inputSpaceId.trim(), passwordHash: hash }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setSpaceId(inputSpaceId.trim())
    setStatus('authenticated')
  }

  /** 建立新空間 */
  const register = async (inputSpaceId: string, password: string, confirm: string) => {
    setError('')
    if (!inputSpaceId.trim() || !password.trim()) {
      setError('請輸入空間 ID 和密碼')
      return
    }
    if (password !== confirm) {
      setError('兩次密碼不一致')
      return
    }
    if (password.length < 4) {
      setError('密碼至少 4 個字元')
      return
    }
    // 空間 ID 只允許英文數字和 -
    if (!/^[a-zA-Z0-9\-_]+$/.test(inputSpaceId.trim())) {
      setError('空間 ID 只能包含英文、數字、- 或 _')
      return
    }

    const existing = await getSpace(inputSpaceId.trim())
    if (existing) {
      setError('此空間 ID 已被使用，請換一個')
      return
    }

    const hash = await hashPassword(password)
    const ok = await createSpace(inputSpaceId.trim(), hash)
    if (!ok) {
      setError('建立失敗，請稍後再試')
      return
    }

    const session: Session = { spaceId: inputSpaceId.trim(), passwordHash: hash }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setSpaceId(inputSpaceId.trim())
    setStatus('authenticated')
  }

  /** 登出 */
  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSpaceId('')
    setStatus('unauthenticated')
  }

  return { status, spaceId, error, isCreatingNew, setIsCreatingNew, login, register, logout }
}
