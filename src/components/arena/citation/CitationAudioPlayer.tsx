import { useState, useCallback, useEffect } from 'react'
import { Button, Select } from 'antd'
import {
  StepBackwardOutlined,
  StepForwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import WavesurferPlayer from '@wavesurfer/react'
import type WaveSurfer from 'wavesurfer.js'
import { formatTimePoint, formatDuration } from './utils'

const { Option } = Select

interface CitationAudioPlayerProps {
  file: string
  totalDuration: number
  open?: boolean
}

export function CitationAudioPlayer({ file, totalDuration, open = true }: CitationAudioPlayerProps) {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    if (!open && wavesurfer) {
      wavesurfer.pause()
      wavesurfer.seekTo(0)
      setPlaybackRate(1)
      wavesurfer.setPlaybackRate(1)
    }
  }, [open, wavesurfer])

  const onReady = useCallback((ws: WaveSurfer) => {
    setWavesurfer(ws)
  }, [])

  const onTimeUpdate = useCallback((_ws: WaveSurfer, time: number) => {
    setCurrentTime(time)
  }, [])

  const togglePlay = useCallback(() => {
    wavesurfer?.playPause()
  }, [wavesurfer])

  const stepBackward = useCallback(() => {
    wavesurfer?.skip(-10)
  }, [wavesurfer])

  const stepForward = useCallback(() => {
    wavesurfer?.skip(10)
  }, [wavesurfer])

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate)
    wavesurfer?.setPlaybackRate(rate)
  }, [wavesurfer])

  return (
    <div className="px-6 py-4 border-b border-slate-200 bg-white">
      <div className="mb-3">
        <div className="bg-slate-50 rounded border border-slate-200 overflow-hidden">
          <WavesurferPlayer
            url={file}
            height={52}
            waveColor="#5eead4"
            progressColor="#14b8a6"
            cursorColor="#0d9488"
            cursorWidth={2}
            barWidth={2}
            barGap={1}
            barRadius={2}
            onReady={onReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeupdate={onTimeUpdate}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
          <span>{formatTimePoint(currentTime)}</span>
          <span>{formatDuration(totalDuration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="text"
          icon={<StepBackwardOutlined />}
          onClick={stepBackward}
          className="!w-8 !h-8 !rounded !p-0"
          size="small"
        />
        <Button
          type="primary"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={togglePlay}
          className="!w-10 !h-10 !rounded !bg-gradient-to-r !from-teal-500 !to-emerald-500 !border-0 !p-0"
          size="small"
        />
        <Button
          type="text"
          icon={<StepForwardOutlined />}
          onClick={stepForward}
          className="!w-8 !h-8 !rounded !p-0"
          size="small"
        />
        <div className="flex items-center gap-1.5 ml-2">
          <ThunderboltOutlined className="text-slate-400 text-xs" />
          <Select
            value={playbackRate}
            onChange={changePlaybackRate}
            size="small"
            className="!w-16 !text-xs"
            variant="borderless"
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
  )
}
