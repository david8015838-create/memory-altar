// ============================================================
// PageTabs - 底部分頁標籤列
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Pencil } from 'lucide-react'
import type { Page, Theme, AppMode } from '../../types'

interface Props {
  pages: Page[]
  currentPageId: string
  mode: AppMode
  theme: Theme
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function PageTabs({ pages, currentPageId, mode, theme, onSelect, onAdd, onRename, onDelete }: Props) {
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null) // B1

  const handleAdd = () => {
    const name = newPageName.trim() || `頁面 ${pages.length + 1}`
    onAdd(name)
    setNewPageName('')
    setIsAddingPage(false)
  }

  const handleRename = (id: string) => {
    if (renameValue.trim()) onRename(id, renameValue.trim())
    setRenamingId(null)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center gap-1 px-3 py-2 overflow-x-auto"
      style={{
        zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${theme.glassBorder}`,
        // iOS safe area
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        scrollbarWidth: 'none',
      }}
    >
      {pages.map(page => (
        <motion.div
          key={page.id}
          className="relative flex-shrink-0"
          layout
        >
          {renamingId === page.id ? (
            // 重命名輸入框
            <div className="flex items-center gap-1">
              <input
                autoFocus
                className="px-2 py-1 rounded-lg text-xs outline-none w-24"
                style={{ background: 'rgba(255,255,255,0.15)', color: theme.textPrimary, border: `1px solid ${theme.glassBorder}` }}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(page.id); if (e.key === 'Escape') setRenamingId(null) }}
              />
              <button onClick={() => handleRename(page.id)} className="p-1">
                <Check size={12} style={{ color: theme.accent }} />
              </button>
              <button onClick={() => setRenamingId(null)} className="p-1">
                <X size={12} style={{ color: theme.textSecondary }} />
              </button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap"
              style={{
                background: currentPageId === page.id ? theme.accent : 'rgba(255,255,255,0.08)',
                color: currentPageId === page.id ? '#fff' : theme.textSecondary,
                border: currentPageId === page.id ? 'none' : `1px solid ${theme.glassBorder}`,
                fontWeight: currentPageId === page.id ? 600 : 400,
                minHeight: 36,
              }}
              onClick={() => onSelect(page.id)}
              onDoubleClick={() => {
                if (mode === 'edit') {
                  setRenamingId(page.id)
                  setRenameValue(page.name)
                }
              }}
            >
              {/* B1: inline delete confirmation */}
              {confirmDeleteId === page.id ? (
                <span className="ml-1 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                  <button
                    className="px-1 rounded text-[9px] font-bold"
                    style={{ background: '#f87171', color: '#fff' }}
                    onClick={e => { e.stopPropagation(); onDelete(page.id); setConfirmDeleteId(null) }}
                  >確定</button>
                  <button
                    className="px-1 rounded text-[9px]"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                  >取消</button>
                </span>
              ) : (
                <>
                  {page.name}
                  {mode === 'edit' && currentPageId === page.id && pages.length > 1 && (
                    <span
                      className="ml-1 opacity-60 hover:opacity-100"
                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(page.id) }}
                    >
                      <X size={10} />
                    </span>
                  )}
                </>
              )}
            </button>
          )}
        </motion.div>
      ))}

      {/* 新增分頁 */}
      <AnimatePresence>
        {mode === 'edit' && (
          isAddingPage ? (
            <motion.div className="flex items-center gap-1 flex-shrink-0"
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}>
              <input
                autoFocus
                className="px-2 py-1 rounded-lg text-xs outline-none w-24"
                style={{ background: 'rgba(255,255,255,0.15)', color: theme.textPrimary, border: `1px solid ${theme.glassBorder}` }}
                placeholder="頁面名稱"
                value={newPageName}
                onChange={e => setNewPageName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAddingPage(false) }}
              />
              <button onClick={handleAdd} className="p-1"><Check size={12} style={{ color: theme.accent }} /></button>
              <button onClick={() => setIsAddingPage(false)} className="p-1"><X size={12} style={{ color: theme.textSecondary }} /></button>
            </motion.div>
          ) : (
            <motion.button
              className="flex-shrink-0 p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${theme.glassBorder}`, minHeight: 36 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAddingPage(true)}
            >
              <Plus size={14} style={{ color: theme.textSecondary }} />
            </motion.button>
          )
        )}
      </AnimatePresence>

      {/* 雙擊提示（編輯模式） */}
      {mode === 'edit' && (
        <span className="flex-shrink-0 flex items-center gap-1 text-xs ml-1" style={{ color: theme.textSecondary, opacity: 0.5 }}>
          <Pencil size={9} /> 雙擊改名
        </span>
      )}
    </div>
  )
}
