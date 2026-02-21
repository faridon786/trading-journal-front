import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tradeCreate, tradeGet, tradeUpdate } from '@/api/trades'
import { TradeForm } from '@/components/trades/TradeForm'
import type { TradeCreateInput } from '@/types/api'
import { Card, CardBody } from '@/components/ui/Card'
import { BackButton } from '@/components/ui/BackButton'

export function TradeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  
  // Get the previous location from state, or default to /trades
  const from = (location.state as { from?: string })?.from || '/trades'

  const { data: trade, isLoading, error } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => tradeGet(Number(id)),
    enabled: isEdit,
  })

  const createMutation = useMutation({
    mutationFn: ({
      payload,
      screenshot,
    }: {
      payload: TradeCreateInput
      screenshot?: File | null
    }) => tradeCreate(payload, screenshot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      navigate('/trades')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id: tradeId,
      payload,
      screenshot,
    }: {
      id: number
      payload: Partial<TradeCreateInput>
      screenshot?: File | null
    }) => tradeUpdate(tradeId, payload, screenshot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['trade', id] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      navigate(from)
    },
  })

  const onSubmit = (payload: TradeCreateInput, screenshot?: File | null) => {
    if (id) {
      updateMutation.mutate({ id: Number(id), payload, screenshot })
      return
    }
    createMutation.mutate({ payload, screenshot })
  }

  const activeMutation = isEdit ? updateMutation : createMutation
  const rawError = activeMutation.error
  const apiError = (() => {
    if (!rawError) return undefined
    const err = rawError as { response?: { data?: unknown }; message?: string }
    const data = err.response?.data
    if (data != null && typeof data === 'object' && !Array.isArray(data)) {
      const messages: string[] = []
      for (const v of Object.values(data)) {
        if (Array.isArray(v)) messages.push(...v.filter((m): m is string => typeof m === 'string'))
        else if (typeof v === 'string') messages.push(v)
      }
      if (messages.length) return messages.join(' ')
    }
    if (typeof data === 'string') return data
    return (err as Error).message || 'Failed to save trade'
  })()
  const isPending = activeMutation.isPending

  return (
    <div className="trade-entry-page">
      <BackButton fallback="/trades" className="trade-entry-page__back-button" />
      <section className="trade-entry-hero">
        <div className="trade-entry-hero__content">
          <h1 className="trade-entry-hero__title">{isEdit ? 'Edit trade journal' : 'New trade journal entry'}</h1>
          <p className="trade-entry-hero__subtitle">
            Capture your setup, execution, risk, and post-trade review in one clean workflow.
          </p>
        </div>
        <div className="trade-entry-hero__meta">
          <span className="trade-entry-hero__pill">Essential fields</span>
          <span className="trade-entry-hero__pill">Screenshot support</span>
          <span className="trade-entry-hero__pill">Pre & post analysis</span>
        </div>
      </section>
      {error && (
        <div className="alert alert--error">
          Failed to load trade
        </div>
      )}
      <Card className="trade-entry-page__form-card">
        <CardBody>
          <TradeForm
            initial={trade}
            loading={isLoading}
            onSubmit={onSubmit}
            isPending={isPending}
            apiError={apiError}
            submitLabel={isEdit ? 'Save trade' : 'Create trade'}
            cancelTo={from}
          />
        </CardBody>
      </Card>
    </div>
  )
}
