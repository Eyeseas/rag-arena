// CitationDetailDrawer - 引用详情抽屉组件

import { useState, useEffect, useRef } from 'react'
import { Drawer, Spin, Empty, Tag, Typography, Alert, Button, Select, Tooltip } from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  BankOutlined,
  CalendarOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ThunderboltOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import type { Citation, CitationDetail } from '@/types/arena'
import { arenaApi } from '@/services/arena'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

interface CitationDetailDrawerProps {
  /** 是否打开 */
  open: boolean
  /** 引用数据 */
  citation: Citation | null
  /** 关闭回调 */
  onClose: () => void
}

// 格式化时长（秒转为分钟:秒）
function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化时间点（秒转为分钟:秒）
function formatTimePoint(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CitationDetailDrawer({ open, citation, onClose }: CitationDetailDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<CitationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 加载引用详情
  useEffect(() => {
    if (open && citation) {
      setLoading(true)
      setError(null)
      setDetail(null)

      arenaApi
        .getCitationDetail(citation.id)
        .then((data) => {
          setDetail(data)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '加载引用详情失败')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setDetail(null)
      setError(null)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [open, citation])

  // 解析 JSON 字符串内容
  const parseContent = (contentStr?: string) => {
    if (!contentStr) return []
    try {
      const parsed = JSON.parse(contentStr)
      return Array.isArray(parsed) ? parsed : [{ text: contentStr, time: 0 }]
    } catch {
      return [{ text: contentStr, time: 0 }]
    }
  }

  const contentItems = detail ? parseContent(detail.content) : []
  const totalDuration = citation?.duration || 0

  // 音频播放控制
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds
      setCurrentTime(seconds)
    }
  }

  const handleBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        totalDuration,
        (audioRef.current.currentTime || 0) + 10,
      )
    }
  }

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  // 生成模拟波形数据（0轴在中间，正负振幅，确保对称）
  const generateWaveform = () => {
    const points = 200
    return Array.from({ length: points }, () => {
      // 生成 -1 到 1 之间的值，模拟音频振幅
      // 使用更真实的波形模式，确保上下对称
      const base = Math.random() * 0.8 + 0.2 // 0.2 到 1.0
      const sign = Math.random() > 0.5 ? 1 : -1
      return base * sign
    })
  }

  const waveformData = totalDuration > 0 ? generateWaveform() : []

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-teal-500" />
          <span>引用详情</span>
        </div>
      }
      placement="right"
      width={900}
      open={open}
      onClose={onClose}
      zIndex={2000}
      styles={{
        body: { padding: 0 },
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="p-6">
          <Alert type="error" message="加载失败" description={error} showIcon />
        </div>
      ) : !citation ? (
        <div className="p-6">
          <Empty description="未选择引用" />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* 1. 通话信息区域 - 紧凑一行显示 */}
          <div className="px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              {/* 主号码 */}
              {citation.callnumber && (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <PhoneOutlined className="text-[10px] text-slate-400" />
                  <span className="font-mono">{citation.callnumber}</span>
                </span>
              )}
              
              {/* 被号码 */}
              {citation.callednumber && (
                <>
                  <span className="text-slate-300">→</span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="font-mono">{citation.callednumber}</span>
                  </span>
                </>
              )}

              {/* 分隔符 */}
              {(citation.callnumber || citation.callednumber) && (citation.duration || citation.start_time) && (
                <span className="text-slate-300">•</span>
              )}

              {/* 时长 */}
              {citation.duration && (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <ClockCircleOutlined className="text-[10px] text-slate-400" />
                  <span>{formatDuration(citation.duration)}</span>
                </span>
              )}

              {/* 分隔符 */}
              {citation.duration && citation.start_time && (
                <span className="text-slate-300">•</span>
              )}

              {/* 日期时间 */}
              {citation.start_time && (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <CalendarOutlined className="text-[10px] text-slate-400" />
                  <span>{citation.start_time}</span>
                </span>
              )}

              {/* 标签 */}
              {citation.labels && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {citation.labels.split('|').map((label, i) => (
                      <Tag key={i} color="blue" className="m-0 !text-[10px] !px-1.5 !py-0.5">
                        {label}
                      </Tag>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. 音频波形图区域 */}
          {detail?.file && (
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              {/* 音频元素（隐藏） */}
              <audio
                ref={audioRef}
                src={detail.file}
                onTimeUpdate={(e) => {
                  const audio = e.currentTarget
                  setCurrentTime(audio.currentTime)
                }}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* 波形图 - 0轴在中间的对称波形（高度缩小一半） */}
              <div className="mb-3">
                <div className="h-16 bg-slate-50 rounded border border-slate-200 p-1.5 relative overflow-x-auto">
                  {/* 0轴参考线 */}
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-300 z-0" />
                  
                  {/* 波形容器 */}
                  <div className="relative h-full flex items-center gap-0.5">
                    {waveformData.map((amplitude, index) => {
                      const time = (index / waveformData.length) * totalDuration
                      const isActive = currentTime >= time && currentTime < (index + 1) / waveformData.length * totalDuration
                      const absAmplitude = Math.abs(amplitude)
                      // 将振幅转换为高度百分比（0-50%，因为上下各占一半），高度缩小一半
                      const heightPercent = Math.max(5, absAmplitude * 25)
                      
                      return (
                        <div
                          key={index}
                          className="relative flex-1 min-w-[2px] cursor-pointer group"
                          onClick={() => handleSeek(time)}
                          title={`跳转到 ${formatTimePoint(time)}`}
                          style={{ height: '100%', position: 'relative' }}
                        >
                          {/* 上方波形（正振幅） */}
                          <div
                            className="absolute left-0 right-0 rounded transition-all duration-200 hover:opacity-80"
                            style={{
                              bottom: '50%',
                              height: `${heightPercent}%`,
                              backgroundColor: isActive ? '#14b8a6' : '#5eead4',
                              minHeight: '1px',
                              display: amplitude >= 0 ? 'block' : 'none',
                            }}
                          />
                          {/* 下方波形（负振幅） */}
                          <div
                            className="absolute left-0 right-0 rounded transition-all duration-200 hover:opacity-80"
                            style={{
                              top: '50%',
                              height: `${heightPercent}%`,
                              backgroundColor: isActive ? '#14b8a6' : '#5eead4',
                              minHeight: '1px',
                              display: amplitude < 0 ? 'block' : 'none',
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                  <span>{formatTimePoint(currentTime)}</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </div>

              {/* 播放控制 - 紧凑布局 */}
              <div className="flex items-center gap-2">
                <Button
                  type="text"
                  icon={<StepBackwardOutlined />}
                  onClick={handleBackward}
                  className="!w-8 !h-8 !rounded !p-0"
                  size="small"
                />
                <Button
                  type="primary"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={handlePlayPause}
                  className="!w-10 !h-10 !rounded !bg-gradient-to-r !from-teal-500 !to-emerald-500 !border-0 !p-0"
                  size="small"
                />
                <Button
                  type="text"
                  icon={<StepForwardOutlined />}
                  onClick={handleForward}
                  className="!w-8 !h-8 !rounded !p-0"
                  size="small"
                />
                <div className="flex items-center gap-1.5 ml-2">
                  <ThunderboltOutlined className="text-slate-400 text-xs" />
                  <Select
                    value={playbackRate}
                    onChange={handleRateChange}
                    size="small"
                    className="!w-16 !text-xs"
                    bordered={false}
                  >
                    <Option value={0.5}>0.5x</Option>
                    <Option value={0.75}>0.75x</Option>
                    <Option value={1}>1x</Option>
                    <Option value={1.25}>1.25x</Option>
                    <Option value={1.5}>1.5x</Option>
                    <Option value={2}>2x</Option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* 3. 内容区域 - 左右分栏，各自独立滚动 */}
          <div className="flex-1 flex p-6 overflow-hidden">
            {/* 左侧：对话内容 - 独立滚动 */}
            <div className="flex-1 flex flex-col min-w-0">
              <Title level={5} className="mb-3 flex items-center gap-2 flex-shrink-0">
                <FileTextOutlined />
                对话内容
              </Title>
              <div className="flex-1 overflow-y-auto pr-2">
                {contentItems.length > 0 ? (
                  <div className="space-y-3">
                    {contentItems.map((item: { role?: string; callnumber?: string; caller?: string; caller_number?: string; callednumber?: string; called?: string; called_number?: string; text?: string; content?: string; speech?: string; time?: number }, index: number) => {
                      // 解析对话内容：支持 role 字段或根据 callnumber/callednumber 判断
                      let role = item.role
                      if (!role) {
                        // 尝试从 item 中提取角色信息
                        if (item.callnumber || item.caller || item.caller_number) {
                          role = 'caller'
                        } else if (item.callednumber || item.called || item.called_number) {
                          role = 'called'
                        } else {
                          // 默认交替显示
                          role = index % 2 === 0 ? 'caller' : 'called'
                        }
                      }
                      const isCaller = role === 'caller' || role === '主' || role === 'caller_number'
                      const textContent = item.text || item.content || item.speech
                      const text = typeof textContent === 'string' ? textContent : String(textContent || '')

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-2 ${isCaller ? 'flex-row' : 'flex-row-reverse'}`}
                        >
                          {/* 头像和时间 */}
                          <div className="flex-shrink-0 flex flex-col items-center gap-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                                isCaller
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                              }`}
                            >
                              {isCaller ? <PhoneOutlined /> : <CustomerServiceOutlined />}
                            </div>
                            {/* 时间小标识 - 统一放在头像下方 */}
                            {item.time !== undefined && (
                              <Tooltip title={formatTimePoint(item.time)}>
                                <span className="text-[10px] text-slate-400 cursor-help">
                                  {formatTimePoint(item.time)}
                                </span>
                              </Tooltip>
                            )}
                          </div>

                          {/* 消息内容 */}
                          <div className={`flex-1 min-w-0 ${isCaller ? '' : 'flex justify-end'}`}>
                            <div
                              className={`inline-block max-w-[75%] px-3 py-2 rounded transition-all duration-200 hover:shadow-sm text-left ${
                                isCaller
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'bg-emerald-50 border border-emerald-200'
                              }`}
                            >
                              <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words text-left">
                                {text}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Empty description="暂无对话内容" />
                )}
              </div>
            </div>

            {/* 右侧：摘要和要素提取 - 独立滚动 */}
            <div className="flex-1 flex flex-col min-w-0 border-l border-slate-200 pl-6">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* 摘要 */}
                <div>
                  <Title level={5} className="mb-3 flex items-center gap-2">
                    <FileTextOutlined />
                    摘要
                  </Title>
                  <div className="p-4 bg-slate-50 rounded border border-slate-200">
                    <Paragraph className="mb-0 text-sm text-slate-700 leading-relaxed">
                      {citation.summary || '暂无摘要'}
                    </Paragraph>
                  </div>
                </div>

                {/* 要素提取 */}
                {detail?.key_elements && (
                  <div>
                    <Title level={5} className="mb-4 flex items-center gap-2">
                      <BulbOutlined className="text-amber-500" />
                      要素提取
                    </Title>
                    <div className="space-y-3">
                      {detail.key_elements.persons && detail.key_elements.persons.length > 0 && (
                        <div className="group p-3.5 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg border border-purple-200/60 hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <UserOutlined className="text-white text-xs" />
                            </div>
                            <Text strong className="text-sm text-slate-800">
                              人物
                            </Text>
                            <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                              {detail.key_elements.persons.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {detail.key_elements.persons.map((person, i) => (
                              <Tag
                                key={i}
                                color="purple"
                                className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-purple-300/50 hover:!border-purple-400 hover:!shadow-sm transition-all duration-200 cursor-default"
                              >
                                {person}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.key_elements.oragnizations && detail.key_elements.oragnizations.length > 0 && (
                        <div className="group p-3.5 bg-gradient-to-br from-cyan-50 to-cyan-50/50 rounded-lg border border-cyan-200/60 hover:border-cyan-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                              <BankOutlined className="text-white text-xs" />
                            </div>
                            <Text strong className="text-sm text-slate-800">
                              组织
                            </Text>
                            <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                              {detail.key_elements.oragnizations.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {detail.key_elements.oragnizations.map((org, i) => (
                              <Tag
                                key={i}
                                color="cyan"
                                className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-cyan-300/50 hover:!border-cyan-400 hover:!shadow-sm transition-all duration-200 cursor-default"
                              >
                                {org}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.key_elements.events && detail.key_elements.events.length > 0 && (
                        <div className="group p-3.5 bg-gradient-to-br from-orange-50 to-orange-50/50 rounded-lg border border-orange-200/60 hover:border-orange-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                              <CalendarOutlined className="text-white text-xs" />
                            </div>
                            <Text strong className="text-sm text-slate-800">
                              事件
                            </Text>
                            <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                              {detail.key_elements.events.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {detail.key_elements.events.map((event, i) => (
                              <Tag
                                key={i}
                                color="orange"
                                className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-orange-300/50 hover:!border-orange-400 hover:!shadow-sm transition-all duration-200 cursor-default"
                              >
                                {event}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.key_elements.others && detail.key_elements.others.length > 0 && (
                        <div className="group p-3.5 bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-lg border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                              <BulbOutlined className="text-white text-xs" />
                            </div>
                            <Text strong className="text-sm text-slate-800">
                              其他
                            </Text>
                            <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                              {detail.key_elements.others.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {detail.key_elements.others.map((other, i) => (
                              <Tag
                                key={i}
                                className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-slate-300/50 hover:!border-slate-400 hover:!shadow-sm transition-all duration-200 cursor-default !bg-white !text-slate-700"
                              >
                                {other}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
