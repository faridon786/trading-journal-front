import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, loading }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete trade?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={!!loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!!loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <p>This action cannot be undone.</p>
    </Modal>
  )
}
