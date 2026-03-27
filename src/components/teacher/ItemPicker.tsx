'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { Category, Item } from '@/lib/types'

interface CategoryWithItems extends Category {
  items: Item[]
}

interface ItemPickerProps {
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

export default function ItemPicker({ selectedIds, onToggle }: ItemPickerProps) {
  const [groups, setGroups] = useState<CategoryWithItems[]>([])
  const [open, setOpen] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('id, name, items(id, front, back)')
      .then(({ data }) => {
        if (data) setGroups(data as CategoryWithItems[])
        // Open first category by default
        if (data?.[0]) setOpen(new Set([data[0].id]))
      })
  }, [])

  function toggleOpen(id: string) {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="space-y-2">
      {groups.map(group => (
        <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleOpen(group.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-800 text-sm">{group.name}</span>
              <span className="text-xs text-indigo-600 font-medium">
                {group.items.filter(i => selectedIds.has(i.id)).length}/{group.items.length} 선택
              </span>
            </div>
            <motion.div animate={{ rotate: open.has(group.id) ? 180 : 0 }}>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {open.has(group.id) && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-gray-100">
                  {group.items.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        name="itemIds"
                        value={item.id}
                        checked={selectedIds.has(item.id)}
                        onChange={() => onToggle(item.id)}
                        className="mt-0.5 accent-indigo-600 w-4 h-4 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.front}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.back}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
