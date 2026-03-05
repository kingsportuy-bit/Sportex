'use client'

import { useState, ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

interface KanbanBoardProps {
  children: ReactNode
  onDragEnd: (itemId: string, sourceColumn: string, targetColumn: string, newIndex: number) => void
  renderDragOverlay?: (activeId: string) => ReactNode
}

export function KanbanBoard({ children, onDragEnd, renderDragOverlay }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeContainer, setActiveContainer] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    // Find which container/column the item belongs to
    if (active.data.current) {
      setActiveContainer(active.data.current.sortable?.containerId || null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveContainer(null)
      return
    }

    const activeContainerId = active.data.current?.sortable?.containerId
    const overContainerId = over.data.current?.sortable?.containerId || over.id

    if (activeContainerId && overContainerId) {
      const overIndex = over.data.current?.sortable?.index ?? 0
      onDragEnd(
        active.id as string,
        activeContainerId as string,
        overContainerId as string,
        overIndex
      )
    }

    setActiveId(null)
    setActiveContainer(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainerId = active.data.current?.sortable?.containerId
    const overContainerId = over.data.current?.sortable?.containerId || over.id

    if (activeContainerId !== overContainerId) {
      // Item is being dragged over a different column
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex-1 pb-4">
        <div className="flex gap-4 w-full">
          {children}
        </div>
      </div>

      <DragOverlay>
        {activeId && renderDragOverlay ? (
          <div className="bg-dark-700 rounded-xl border border-dark-600 p-4 shadow-2xl opacity-90 rotate-2 scale-105">
            {renderDragOverlay(activeId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}