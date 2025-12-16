'use client'

import { useState, useCallback } from 'react'

interface AuthState {
  isAuthenticated: boolean
  sessionExpiry: number | null
}

// 会话持续时间（30分钟）
const SESSION_DURATION = 30 * 60 * 1000

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // 从 sessionStorage 恢复认证状态
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('admin_auth')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.sessionExpiry && Date.now() < parsed.sessionExpiry) {
            return parsed
          }
        } catch (error) {
          console.error('Failed to parse stored auth state:', error)
        }
      }
    }
    return { isAuthenticated: false, sessionExpiry: null }
  })

  // 登录
  const login = useCallback(() => {
    const newState = {
      isAuthenticated: true,
      sessionExpiry: Date.now() + SESSION_DURATION
    }
    setAuthState(newState)
    
    // 保存到 sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_auth', JSON.stringify(newState))
    }
  }, [])

  // 登出
  const logout = useCallback(() => {
    const newState = { isAuthenticated: false, sessionExpiry: null }
    setAuthState(newState)
    
    // 清除 sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_auth')
    }
  }, [])

  // 检查会话是否过期
  const checkSession = useCallback(() => {
    if (authState.sessionExpiry && Date.now() >= authState.sessionExpiry) {
      logout()
      return false
    }
    return authState.isAuthenticated
  }, [authState, logout])

  // 延长会话
  const extendSession = useCallback(() => {
    if (authState.isAuthenticated) {
      const newState = {
        ...authState,
        sessionExpiry: Date.now() + SESSION_DURATION
      }
      setAuthState(newState)
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_auth', JSON.stringify(newState))
      }
    }
  }, [authState])

  return {
    isAuthenticated: checkSession(),
    login,
    logout,
    extendSession,
    sessionExpiry: authState.sessionExpiry
  }
}