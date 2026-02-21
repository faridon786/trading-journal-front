import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react'
import { tagsList, tagCreate, tagUpdate, tagDelete } from '@/api/tags'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { Tag as TagType } from '@/types/api'

export function TagsPage() {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState('')
  const [editName, setEditName] = useState('')
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null)
  const queryClient = useQueryClient()

  const { data: tags, isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsList,
  })
  const createMutation = useMutation({
    mutationFn: tagCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setName('')
      setOpen(false)
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, name: tagName }: { id: number; name: string }) => tagUpdate(id, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setEditName('')
      setSelectedTag(null)
      setEditOpen(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: tagDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setSelectedTag(null)
      setDeleteOpen(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createMutation.mutate(trimmed)
  }
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed || !selectedTag) return
    updateMutation.mutate({ id: selectedTag.id, name: trimmed })
  }
  const openEditModal = (tag: TagType) => {
    setSelectedTag(tag)
    setEditName(tag.name)
    setEditOpen(true)
  }
  const openDeleteModal = (tag: TagType) => {
    setSelectedTag(tag)
    setDeleteOpen(true)
  }

  return (
    <div>
      <div className="page-actions">
        <header className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-header__title">Tags</h1>
          <p className="page-header__subtitle">Organize trades with tags</p>
        </header>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Add tag
        </Button>
      </div>

      {error && (
        <div className="alert alert--error">
          Failed to load tags
        </div>
      )}

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading…</span>
            </div>
          ) : !tags?.length ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden>
                <Tag size={28} />
              </div>
              <p className="empty-state__title">No tags yet</p>
              <p>Add a tag to categorize your trades.</p>
              <div className="empty-state__action">
                <Button variant="primary" onClick={() => setOpen(true)}>
                  <Plus size={18} />
                  Add tag
                </Button>
              </div>
            </div>
          ) : (
            <ul className="content-list">
              {tags.map((t) => (
                <li key={t.id} className="content-list__item">
                  <span style={{ flex: 1, minWidth: 0 }}>{t.name}</span>
                  <span style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`Edit ${t.name}`}
                      onClick={() => openEditModal(t)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => openDeleteModal(t)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add tag"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="tag-form"
              variant="primary"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </>
        }
      >
        <form id="tag-form" onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            error={createMutation.error ? 'Failed to create' : undefined}
          />
        </form>
      </Modal>
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit tag"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="tag-edit-form"
              variant="primary"
              disabled={updateMutation.isPending || !editName.trim()}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form id="tag-edit-form" onSubmit={handleEditSubmit}>
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            error={updateMutation.error ? 'Failed to update' : undefined}
          />
        </form>
      </Modal>
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete tag"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => selectedTag && deleteMutation.mutate(selectedTag.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{selectedTag?.name ?? 'this tag'}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
