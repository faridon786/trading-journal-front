import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Target, Pencil, Trash2 } from 'lucide-react'
import { strategiesList, strategyCreate, strategyUpdate, strategyDelete } from '@/api/strategies'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { Strategy } from '@/types/api'

export function StrategiesPage() {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState('')
  const [editName, setEditName] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const queryClient = useQueryClient()

  const { data: strategies, isLoading, error } = useQuery({
    queryKey: ['strategies'],
    queryFn: strategiesList,
  })
  const createMutation = useMutation({
    mutationFn: strategyCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
      setName('')
      setOpen(false)
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, name: strategyName }: { id: number; name: string }) => strategyUpdate(id, strategyName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
      setEditName('')
      setSelectedStrategy(null)
      setEditOpen(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: strategyDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
      setSelectedStrategy(null)
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
    if (!trimmed || !selectedStrategy) return
    updateMutation.mutate({ id: selectedStrategy.id, name: trimmed })
  }
  const openEditModal = (strategy: Strategy) => {
    setSelectedStrategy(strategy)
    setEditName(strategy.name)
    setEditOpen(true)
  }
  const openDeleteModal = (strategy: Strategy) => {
    setSelectedStrategy(strategy)
    setDeleteOpen(true)
  }

  return (
    <div>
      <div className="page-actions">
        <header className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-header__title">Strategies</h1>
          <p className="page-header__subtitle">Define strategies to group and analyze trades</p>
        </header>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Add strategy
        </Button>
      </div>

      {error && (
        <div className="alert alert--error">
          Failed to load strategies
        </div>
      )}

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading…</span>
            </div>
          ) : !strategies?.length ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden>
                <Target size={28} />
              </div>
              <p className="empty-state__title">No strategies yet</p>
              <p>Add a strategy to assign to your trades.</p>
              <div className="empty-state__action">
                <Button variant="primary" onClick={() => setOpen(true)}>
                  <Plus size={18} />
                  Add strategy
                </Button>
              </div>
            </div>
          ) : (
            <ul className="content-list">
              {strategies.map((s) => (
                <li key={s.id} className="content-list__item">
                  <span style={{ flex: 1, minWidth: 0 }}>{s.name}</span>
                  <span style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`Edit ${s.name}`}
                      onClick={() => openEditModal(s)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => openDeleteModal(s)}
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
        title="Add strategy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="strategy-form"
              variant="primary"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} id="strategy-form">
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
        title="Edit strategy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="strategy-edit-form"
              variant="primary"
              disabled={updateMutation.isPending || !editName.trim()}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} id="strategy-edit-form">
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
        title="Delete strategy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => selectedStrategy && deleteMutation.mutate(selectedStrategy.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{selectedStrategy?.name ?? 'this strategy'}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
