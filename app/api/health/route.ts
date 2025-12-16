import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db/init'

export async function GET() {
  try {
    const health = await checkDatabaseHealth()
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: health,
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: { connected: false },
    }, { status: 500 })
  }
}