// HoldToConfirmButton - 长按确认按钮组件
// 使用 motion 实现长按进度条动画

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { LikeOutlined, LikeFilled, CheckCircleFilled } from '@ant-design/icons'

interface HoldToConfirmButtonProps {
  /** 是否已确认（已点赞） */
  isConfirmed: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 加载状态 */
  loading?: boolean
  /** 确认回调 */
  onConfirm: () => void
  /** 悬浮状态回调 */
  onHover?: (isHovering: boolean) => void
  /** 长按持续时间（毫秒） */
  holdDuration?: number
}

export function HoldToConfirmButton({
  isConfirmed,
  disabled = false,
  loading = false,
  onConfirm,
  onHover,
  holdDuration = 800,
}: HoldToConfirmButtonProps) {
  const [isHolding, setIsHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const handlePressStart = useCallback(() => {
    if (disabled || loading) return

    // 如果已点赞，直接触发取消点赞
    if (isConfirmed) {
      onConfirm()
      return
    }

    setIsHolding(true)
    setProgress(0)
    startTimeRef.current = Date.now()

    // 进度更新
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min(elapsed / holdDuration, 1)
      setProgress(newProgress)

      if (newProgress >= 1) {
        clearTimers()
        setIsHolding(false)
        setProgress(0)
        onConfirm()
      }
    }, 16) // ~60fps
  }, [disabled, loading, isConfirmed, holdDuration, onConfirm, clearTimers])

  const handlePressEnd = useCallback(() => {
    clearTimers()
    setIsHolding(false)
    setProgress(0)
  }, [clearTimers])

  // 鼠标/触摸离开按钮时取消
  const handlePointerLeave = useCallback(() => {
    if (isHolding) {
      handlePressEnd()
    }
  }, [isHolding, handlePressEnd])

  const isDisabledStyle = disabled && !isConfirmed

  return (
    <motion.button
      className={`
        relative overflow-hidden px-4 py-1.5 rounded
        font-medium text-sm
        transition-colors duration-200
        flex items-center gap-2
        min-w-[90px] justify-center
        border
        ${isConfirmed 
          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-teal-400 shadow-lg shadow-teal-500/25' 
          : isDisabledStyle
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-600 cursor-pointer'
        }
      `}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePressEnd}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      whileHover={!disabled && !isConfirmed ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isConfirmed ? { scale: 0.98 } : {}}
      disabled={isDisabledStyle}
      style={{ touchAction: 'none' }} // 防止触摸滚动
    >
      {/* 长按进度条背景 */}
      <AnimatePresence>
        {isHolding && !isConfirmed && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            exit={{ scaleX: 0, opacity: 0 }}
            style={{ 
              transformOrigin: 'left',
            }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      {/* 成功时的波纹效果 */}
      <AnimatePresence>
        {isConfirmed && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* 按钮内容 */}
      <span 
        className={`
          relative z-10 flex items-center gap-2 
          transition-colors duration-150
          ${isHolding ? 'text-white' : ''}
        `}
      >
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : isConfirmed ? (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <CheckCircleFilled className="text-white" />
          </motion.span>
        ) : (
          <span>
            {isHolding ? <LikeFilled /> : <LikeOutlined />}
          </span>
        )}
        
        <span className="relative whitespace-nowrap">
          {isConfirmed ? '已投票' : '按住投票'}
        </span>
      </span>
    </motion.button>
  )
}

