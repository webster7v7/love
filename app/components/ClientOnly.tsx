'use client'

import { useState, useEffect, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * ClientOnly 组件 - 确保子组件只在客户端渲染
 * 用于避免 SSR hydration 不匹配问题
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 使用 setTimeout 避免直接在 effect 中调用 setState
    const timer = setTimeout(() => {
      setIsClient(true)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}