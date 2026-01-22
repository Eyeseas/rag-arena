import { createFileRoute } from '@tanstack/react-router'
import { ArenaPage } from '@/pages/arena/ArenaPage'

export const Route = createFileRoute('/')({
  component: ArenaPage,
})
