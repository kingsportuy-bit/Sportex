'use client'

import { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface KanbanColumnProps {
  id: string
  title: string
  subtitle?: string
  count: number
  color: string
  itemIds: string[]
  children: ReactNode
}

export function KanbanColumn({ id, title, subtitle, count, color, itemIds, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className={`flex flex-col flex-1 min-w-0 rounded-2xl border transition-colors duration-200 ${isOver ? 'border-primary/30 bg-dark-800/80' : 'border-white/5 bg-dark-800/40'
      }`}>
      {/* Column Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="font-bold text-sm text-white tracking-wide">{title}</h3>
          </div>
          <span className="text-xs font-bold text-dark-300 bg-dark-700 px-2.5 py-1 rounded-lg">
            {count}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-dark-300 mt-1.5 ml-6">{subtitle}</p>
        )}
      </div>

      {/* Column Content — droppable area */}
      <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 p-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[120px]"
        >
          {children}
          {itemIds.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-white/5 rounded-xl">
              <p className="text-xs text-dark-400 font-medium">Sin elementos</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}