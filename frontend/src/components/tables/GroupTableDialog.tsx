import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { EventTable } from '../../types'
import { api } from '../../services/api'
import { Icon } from '../Icon'

export function GroupTableDialog({
  open,
  current,
  onClose,
  onSaved,
}: {
  open: boolean
  current?: EventTable
  onClose: () => void
  onSaved: (table: EventTable, created: boolean) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const locked = useRef(false)
  const [name, setName] = useState('')
  const [rename, setRename] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (!open) {
      el.close()
      return
    }
    setName('')
    setRename(current?.name ?? '')
    setError('')
    el.showModal()
    return () => el.close()
  }, [open, current?.id, current?.name])
  async function submit(event: FormEvent, creating: boolean) {
    event.preventDefault()
    if (locked.current) return
    locked.current = true
    setPending(true)
    setError('')
    try {
      const table = creating
        ? await api.createTable(name.trim() || undefined)
        : await api.renameTable(current!.id, rename.trim())
      onSaved(table, creating)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '그룹을 변경하지 못했어요.',
      )
    } finally {
      locked.current = false
      setPending(false)
    }
  }
  return (
    <dialog
      ref={dialog}
      className="group-table-dialog"
      aria-labelledby="group-table-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!locked.current) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialog.current && !locked.current) onClose()
      }}
    >
      <div className="group-dialog-heading">
        <h2 id="group-table-title">그룹 테이블</h2>
        <button
          type="button"
          className="group-icon-button"
          aria-label="그룹 관리 닫기"
          disabled={pending}
          onClick={onClose}
        >
          <Icon name="close" size={19} />
        </button>
      </div>
      <form onSubmit={(e) => void submit(e, true)}>
        <label htmlFor="new-group-name">새 그룹 만들기</label>
        <input
          id="new-group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="그룹 이름 (비워두면 자동 지정)"
          maxLength={60}
          disabled={pending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="group-save-button"
          disabled={pending || Array.from(name.trim()).length > 30}
        >
          {pending ? '저장 중…' : '그룹 만들고 입장하기'}
        </button>
      </form>
      {current && (
        <form onSubmit={(e) => void submit(e, false)}>
          <label htmlFor="rename-group-name">현재 그룹 이름 바꾸기</label>
          <input
            id="rename-group-name"
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            maxLength={60}
            disabled={pending}
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="group-save-button secondary"
            disabled={
              pending ||
              !rename.trim() ||
              Array.from(rename.trim()).length > 30 ||
              rename.trim() === current.name
            }
          >
            이름 바꾸기
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="group-dialog-error">
          {error}
        </p>
      )}
    </dialog>
  )
}
