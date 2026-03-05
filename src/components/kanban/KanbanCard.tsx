'use client'

import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps {
  id: string
  color?: string
  onClick?: () => void
  children: ReactNode
}

export function KanbanCard({ id, onClick, children }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
                p-4 rounded-xl border border-white/5 bg-dark-700/60
                hover:border-white/10 hover:bg-dark-700
                transition-all duration-200 cursor-grab active:cursor-grabbing
                ${isDragging ? 'shadow-2xl ring-2 ring-primary/20' : ''}
                ${onClick ? 'cursor-pointer' : ''}
            `}
    >
      {children}
    </div>
  )
}