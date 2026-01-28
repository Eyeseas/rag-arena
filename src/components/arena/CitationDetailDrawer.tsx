// CitationDetailDrawer - 引用详情抽屉组件

import { useEffect } from 'react'
import { Drawer, Spin, Empty, Alert } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import type { Citation } from '@/types/arena'
import { useCitationDetail } from '@/hooks/arena/useCitationDetail'
import { useCitationAudio } from '@/hooks/arena/useCitationAudio'
import {
  CitationHeader,
  CitationAudioPlayer,
  CitationConversationList,
  CitationAnalysisPanel,
} from './citation'

interface CitationDetailDrawerProps {
  /** 是否打开 */
  open: boolean
  /** 引用数据 */
  citation: Citation | null
  /** 私有ID（用于API调用） */
  priId: string | null
  /** 关闭回调 */
  onClose: () => void
}

export function CitationDetailDrawer({ open, citation, priId, onClose }: CitationDetailDrawerProps) {
  const { loading, detail, error } = useCitationDetail(open, citation, priId)
  const totalDuration = citation?.duration || 0
  const audioState = useCitationAudio(totalDuration)

  // Reset audio when closed
  useEffect(() => {
    if (!open) {
      audioState.reset()
    }
  }, [open, audioState])

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
          <CitationHeader citation={citation} />

          {/* 2. 音频波形图区域 */}
          {detail?.file && (
            <CitationAudioPlayer
              file={detail.file}
              totalDuration={totalDuration}
              audioState={audioState}
            />
          )}

          {/* 3. 内容区域 - 左右分栏，各自独立滚动 */}
          <div className="flex-1 flex p-6 overflow-hidden">
            {/* 左侧：对话内容 - 独立滚动 */}
            <CitationConversationList content={detail?.content} />

            {/* 右侧：摘要和要素提取 - 独立滚动 */}
            <CitationAnalysisPanel 
              summary={citation.summary} 
              keyElements={detail?.key_elements} 
            />
          </div>
        </div>
      )}
    </Drawer>
  )
}
