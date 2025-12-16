'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FaEye, FaSync, FaWifi, FaWifiSlash, FaArrowUp } from 'react-icons/fa'
import { useRealTimeVisitStats } from '../hooks/useRealTimeVisitStats'

interface StatCardProps {
  label: string
  value: number
  previousValue: number
  delay: number
  isLoading: boolean
}

function StatCard({ label, value, previousValue, delay, isLoading }: StatCardProps) {
  const hasIncreased = value > previousValue && previousValue > 0
  const increase = hasIncreased ? value - previousValue : 0
  
  return (
    <motion.div
      className="glass-card rounded-2xl p-6 min-w-[120px] flex flex-col items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* 增长动画效果 */}
      <AnimatePresence>
        {hasIncreased && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* 数值 */}
      <motion.div
        className="text-3xl md:text-4xl font-bold mb-2 gradient-text relative z-10"
        key={value}
        initial={{ scale: hasIncreased ? 1.3 : 1, color: hasIncreased ? '#10b981' : undefined }}
        animate={{ scale: 1, color: undefined }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {value.toLocaleString()}
      </motion.div>
      
      {/* 标签 */}
      <div className="text-sm md:text-base text-gray-600 font-medium relative z-10">
        {label}
      </div>

      {/* 增长指示器 */}
      <AnimatePresence>
        {hasIncreased && (
          <motion.div
            className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.6 }}
          >
            <FaArrowUp className="text-xs" />
            <span>+{increase}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function EnhancedVisitCounter() {
  const {
    stats,
    previousStats,
    isLoading,
    isOnline,
    lastUpdate,
    refresh,
    forceRefresh
  } = useRealTimeVisitStats({
    updateInterval: 10000, // 10秒更新
    enableRealTime: true,
    recordVisitOnMount: true
  })

  return (
    <motion.section
      className="flex flex-col items-center gap-8 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 标题和控制栏 */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <FaEye className="text-2xl text-pink-500" />
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-700">
            实时访问统计
          </h3>
          <FaEye className="text-2xl text-pink-500" />
        </div>

        {/* 状态和控制栏 */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {/* 网络状态 */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <FaWifi className="text-green-500" />
            ) : (
              <FaWifiSlash className="text-red-500" />
            )}
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? '在线' : '离线'}
            </span>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-50"
            title="刷新数据"
          >
            <FaSync className={`text-xs ${isLoading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          {/* 强制刷新按钮 */}
          <button
            onClick={() => forceRefresh()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
            title="强制刷新（绕过缓存）"
          >
            <FaSync className={`text-xs ${isLoading ? 'animate-spin' : ''}`} />
            <span>实时</span>
          </button>

          {/* 最后更新时间 */}
          {lastUpdate && (
            <span className="text-gray-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full">
        <StatCard 
          label="今日" 
          value={stats.daily} 
          previousValue={previousStats.daily}
          delay={0}
          isLoading={isLoading}
        />
        <StatCard 
          label="本周" 
          value={stats.weekly} 
          previousValue={previousStats.weekly}
          delay={0.1}
          isLoading={isLoading}
        />
        <StatCard 
          label="本月" 
          value={stats.monthly} 
          previousValue={previousStats.monthly}
          delay={0.2}
          isLoading={isLoading}
        />
        <StatCard 
          label="总计" 
          value={stats.total} 
          previousValue={previousStats.total}
          delay={0.3}
          isLoading={isLoading}
        />
      </div>

      {/* 实时更新提示 */}
      <motion.div
        className="flex flex-col items-center gap-2 text-xs text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>每10秒自动更新</span>
        </div>
        
        <div className="text-center">
          <div>• 页面切换时自动刷新</div>
          <div>• 网络恢复时自动同步</div>
          <div>• 数据变化时显示动画</div>
        </div>
      </motion.div>
    </motion.section>
  )
}