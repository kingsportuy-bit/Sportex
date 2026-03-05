'use client'

import { useState } from 'react'
import { KanbanBoard, KanbanColumn, KanbanCard } from '@/components/kanban'

interface Card {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: { name: string }
  dueDate: string
  tags: string[]
}

interface Column {
  id: string
  title: string
  color: string
  cardIds: string[]
}

export default function KanbanDemoPage() {
  const [cards, setCards] = useState<Record<string, Card>>({
    '1': {
      id: '1',
      title: 'Diseñar nuevo dashboard',
      description: 'Crear wireframes y prototipos para la interfaz de usuario',
      priority: 'high',
      assignee: { name: 'Ana García' },
      dueDate: '2024-02-20',
      tags: ['UI/UX', 'Frontend']
    },
    '2': {
      id: '2',
      title: 'Configurar servidor de producción',
      description: 'Preparar ambiente de producción con todas las configuraciones necesarias',
      priority: 'medium',
      assignee: { name: 'Carlos López' },
      dueDate: '2024-02-25',
      tags: ['DevOps', 'Backend']
    },
    '3': {
      id: '3',
      title: 'Implementar autenticación',
      description: 'Integrar sistema de login con JWT y protección de rutas',
      priority: 'urgent',
      assignee: { name: 'María Rodríguez' },
      dueDate: '2024-02-15',
      tags: ['Seguridad', 'Backend']
    },
    '4': {
      id: '4',
      title: 'Optimizar consultas SQL',
      description: 'Mejorar el rendimiento de las consultas más pesadas',
      priority: 'high',
      assignee: { name: 'Juan Pérez' },
      dueDate: '2024-02-18',
      tags: ['Base de datos', 'Performance']
    },
    '5': {
      id: '5',
      title: 'Pruebas de integración',
      description: 'Verificar que todos los componentes funcionen correctamente juntos',
      priority: 'medium',
      assignee: { name: 'Laura Martínez' },
      dueDate: '2024-02-22',
      tags: ['Testing', 'QA']
    },
    '6': {
      id: '6',
      title: 'Documentación API',
      description: 'Crear documentación completa de la API REST',
      priority: 'low',
      assignee: { name: 'Pedro Sánchez' },
      dueDate: '2024-02-10',
      tags: ['Documentación']
    },
    '7': {
      id: '7',
      title: 'Setup inicial del proyecto',
      description: 'Configuración básica del repositorio y estructura del proyecto',
      priority: 'medium',
      assignee: { name: 'Equipo' },
      dueDate: '2024-02-05',
      tags: ['Setup']
    }
  })

  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'Por Hacer',
      color: '#8B5CF6',
      cardIds: ['1', '2']
    },
    {
      id: 'in-progress',
      title: 'En Progreso',
      color: '#3B82F6',
      cardIds: ['3', '4']
    },
    {
      id: 'review',
      title: 'En Revisión',
      color: '#F59E0B',
      cardIds: ['5']
    },
    {
      id: 'done',
      title: 'Completado',
      color: '#10B981',
      cardIds: ['6', '7']
    }
  ])

  const handleDragEnd = (itemId: string, sourceColumn: string, targetColumn: string, newIndex: number) => {
    if (sourceColumn === targetColumn) {
      const column = columns.find(c => c.id === sourceColumn)
      if (!column) return

      const newCardIds = [...column.cardIds]
      const oldIndex = newCardIds.indexOf(itemId)
      newCardIds.splice(oldIndex, 1)
      newCardIds.splice(newIndex, 0, itemId)

      setColumns(columns.map(c => c.id === sourceColumn ? { ...c, cardIds: newCardIds } : c))
    } else {
      const sourceCol = columns.find(c => c.id === sourceColumn)
      const targetCol = columns.find(c => c.id === targetColumn)
      if (!sourceCol || !targetCol) return

      const newSourceCardIds = sourceCol.cardIds.filter(id => id !== itemId)
      const newTargetCardIds = [...targetCol.cardIds]
      newTargetCardIds.splice(newIndex, 0, itemId)

      setColumns(columns.map(c => {
        if (c.id === sourceColumn) return { ...c, cardIds: newSourceCardIds }
        if (c.id === targetColumn) return { ...c, cardIds: newTargetCardIds }
        return c
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-6 md:p-8">
      <div className="max-w-[2000px] mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Tablero de Proyecto - SPORTEX</h1>
        <KanbanBoard onDragEnd={handleDragEnd}>
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={column.cardIds.length}
              itemIds={column.cardIds}
            >
              {column.cardIds.map(cardId => {
                const card = cards[cardId]
                return (
                  <KanbanCard key={card.id} id={card.id}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${card.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          card.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            card.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                          }`}>
                          {card.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{card.title}</h4>
                      <p className="text-xs text-dark-300 line-clamp-2">{card.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-dark-600 border-2 border-dark-700 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{card.assignee.name.charAt(0)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-dark-400 font-medium">{card.dueDate}</span>
                      </div>
                    </div>
                  </KanbanCard>
                )
              })}
            </KanbanColumn>
          ))}
        </KanbanBoard>
      </div>
    </div>
  )
}
