import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, FileText, ImagePlus, Upload, X, Calculator } from 'lucide-react'
import type { Trade, TradeCreateInput, TradeTemplate } from '@/types/api'
import { strategiesList } from '@/api/strategies'
import { symbolsList, symbolCreate } from '@/api/symbols'
import { tagsList } from '@/api/tags'
import { tradeTemplatesList, tradeTemplateCreate } from '@/api/trade-templates'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ScreenshotView } from '@/components/ui/ScreenshotView'
import {
  getOutcomeFromPnl,
  pnlSignMatchesPrices,
  getBestProfitCalculation,
} from '@/utils/tradeLogic'

const schema = z
  .object({
    symbol: z.number().min(1, 'Select a symbol'),
    side: z.enum(['long', 'short']),
    entry_price: z.coerce.number().min(0.000001, 'Entry price is required'),
    exit_price: z.coerce.number().min(0.000001, 'Exit price is required'),
    amount_invested: z.union([z.coerce.number(), z.nan()]).optional().nullable(),
    amount_risked: z.union([z.coerce.number(), z.nan()]).optional().nullable(),
    leverage: z.union([z.coerce.number(), z.nan()]).optional().nullable(),
    entry_date: z.string().min(1, 'Entry date is required'),
    exit_date: z.string().min(1, 'Exit date is required'),
    pnl: z.coerce.number(),
    notes: z.string().optional(),
    strategy: z.union([z.number(), z.nan()]).optional().nullable(),
    tag_ids: z.array(z.number()).optional(),
    emotion_rating: z.union([z.number(), z.nan()]).optional().nullable(),
    emotion_notes: z.string().optional(),
    pre_trade_plan: z.string().optional(),
    post_trade_review: z.string().optional(),
    is_paper: z.boolean().optional(),
  })
  .refine((data) => new Date(data.exit_date) >= new Date(data.entry_date), {
    message: 'Exit date must be on or after entry date',
    path: ['exit_date'],
  })
  .refine(
    (data) => {
      const lev = data.leverage != null ? Number(data.leverage) : 1
      return !Number.isFinite(lev) || lev > 0
    },
    { message: 'Leverage must be greater than 0.', path: ['leverage'] }
  )
  .refine(
    (data) => {
      // Only validate if we have all required fields for validation
      if (
        data.entry_price != null &&
        data.exit_price != null &&
        data.pnl != null &&
        data.side &&
        Number.isFinite(data.entry_price) &&
        Number.isFinite(data.exit_price) &&
        Number.isFinite(data.pnl)
      ) {
        return pnlSignMatchesPrices(data.side, data.entry_price, data.exit_price, data.pnl)
      }
      return true
    },
    {
      message: 'Profit amount sign does not match trade direction: Long trades should profit when exit > entry, Short trades should profit when entry > exit.',
      path: ['pnl']
    }
  )

type FormData = z.infer<typeof schema>

function toFormData(t: Trade): FormData {
  return {
    symbol: t.symbol,
    side: t.side as 'long' | 'short',
    entry_price: Number(t.entry_price),
    exit_price: Number(t.exit_price),
    amount_invested: null, // Not stored in backend, calculated field
    amount_risked: t.amount_risked != null && t.amount_risked !== '' ? Number(t.amount_risked) : null,
    entry_date: t.entry_date.slice(0, 16),
    exit_date: t.exit_date.slice(0, 16),
    pnl: Number(t.pnl),
    leverage: t.leverage != null && t.leverage !== '' ? Number(t.leverage) : 1,
    notes: t.notes || '',
    strategy: t.strategy ?? null,
    tag_ids: t.tags?.map((x) => x.id) ?? [],
    emotion_rating: t.emotion_rating ?? null,
    emotion_notes: t.emotion_notes || '',
    pre_trade_plan: t.pre_trade_plan || '',
    post_trade_review: t.post_trade_review || '',
    is_paper: t.is_paper ?? false,
  }
}

interface Props {
  initial?: Trade | null
  loading?: boolean
  onSubmit: (data: TradeCreateInput, screenshot?: File | null) => void
  isPending?: boolean
  apiError?: string
  submitLabel?: string
  cancelTo?: string
}

export function TradeForm({
  initial,
  loading,
  onSubmit,
  isPending,
  apiError,
  submitLabel = 'Save',
  cancelTo,
}: Props) {
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [screenshotDragOver, setScreenshotDragOver] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [addSymbolOpen, setAddSymbolOpen] = useState(false)
  const [newSymbolName, setNewSymbolName] = useState('')

  const handleScreenshotFile = (file: File | null) => {
    if (file && !file.type.startsWith('image/')) return
    setScreenshotFile(file)
  }

  const handleScreenshotDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setScreenshotDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleScreenshotFile(file)
  }

  const handleScreenshotDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setScreenshotDragOver(true)
  }

  const handleScreenshotDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setScreenshotDragOver(false)
  }
  const [templateName, setTemplateName] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: strategiesList,
    staleTime: 5 * 60 * 1000,
  })
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsList,
    staleTime: 5 * 60 * 1000,
  })
  const { data: symbols } = useQuery({
    queryKey: ['symbols'],
    queryFn: symbolsList,
    staleTime: 5 * 60 * 1000,
  })
  const { data: templates } = useQuery({
    queryKey: ['trade-templates'],
    queryFn: tradeTemplatesList,
    staleTime: 2 * 60 * 1000,
  })

  const saveTemplateMutation = useMutation({
    mutationFn: tradeTemplateCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade-templates'] })
      setSaveTemplateOpen(false)
      setTemplateName('')
    },
  })

  const addSymbolMutation = useMutation({
    mutationFn: symbolCreate,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['symbols'] })
      setValue('symbol', created.id)
      setAddSymbolOpen(false)
      setNewSymbolName('')
    },
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
        defaultValues: initial
      ? toFormData(initial)
      : {
          symbol: 0,
          side: 'long',
          entry_price: 0,
          exit_price: 0,
          amount_invested: null,
          amount_risked: null,
          entry_date: '',
          exit_date: '',
          pnl: 0,
          leverage: 1,
          notes: '',
          strategy: null,
          tag_ids: [],
          emotion_rating: null,
          emotion_notes: '',
          pre_trade_plan: '',
          post_trade_review: '',
          is_paper: false,
        },
  })
  const { register, handleSubmit, watch, setValue, reset } = form

  useEffect(() => {
    if (initial) reset(toFormData(initial))
  }, [initial, reset])

  useEffect(() => {
    if (screenshotFile) {
      const url = URL.createObjectURL(screenshotFile)
      setScreenshotPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    if (initial?.screenshot) setScreenshotPreview(initial.screenshot)
    else setScreenshotPreview(null)
  }, [screenshotFile, initial?.screenshot])

  // Clear R/R calculation error when inputs change

  const tagIds = watch('tag_ids') ?? []
  const strategyValue = watch('strategy')
  const symbolValue = watch('symbol')
  const entryPrice = watch('entry_price')
  const exitPrice = watch('exit_price')
  const amountInvestedValue = watch('amount_invested')
  const side = watch('side')
  const pnlValue = watch('pnl')
  const leverageValue = watch('leverage')
  const amountRiskedValue = watch('amount_risked')
  const isPaper = watch('is_paper')
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<number>(0)
  const [calculationMethod, setCalculationMethod] = useState<'amount' | 'manual' | null>(null)

  const sliderPosition = isDragging ? dragPosition : (isPaper ? 1 : 0)

  // Helper to convert form values to numbers (handles null/empty strings)
  const toNumber = (value: number | null | undefined | string): number | null => {
    if (value == null || value === '') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const handleCalculatePnl = () => {
    const entry = toNumber(entryPrice)
    const exit = toNumber(exitPrice)
    const amountInvested = toNumber(amountInvestedValue)
    const lev = toNumber(leverageValue)

    if (entry == null || exit == null || !side) {
      setCalculationMethod(null)
      return
    }

    const { profit, method } = getBestProfitCalculation(
      side as 'long' | 'short',
      entry,
      exit,
      null,
      amountInvested,
      lev ?? 1
    )

    if (profit != null) {
      setValue('pnl', profit, { shouldValidate: true })
      setCalculationMethod(method === 'amount' ? 'amount' : null)
    } else {
      setCalculationMethod(null)
    }
  }

  const getPositionFromClientX = (clientX: number): number => {
    const track = trackRef.current
    if (!track) return isPaper ? 1 : 0
    const rect = track.getBoundingClientRect()
    const x = clientX - rect.left
    return Math.max(0, Math.min(1, x / rect.width))
  }

  const handleSliderPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const track = trackRef.current
    if (!track) return
    track.setPointerCapture(e.pointerId)
    setIsDragging(true)
    setDragPosition(getPositionFromClientX(e.clientX))
  }

  const handleSliderPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setDragPosition(getPositionFromClientX(e.clientX))
  }

  const handleSliderPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    const track = trackRef.current
    if (track) track.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    const pos = getPositionFromClientX(e.clientX)
    setValue('is_paper', pos >= 0.5)
  }


  const pnl = toNumber(pnlValue)
  const pnlOutcome = pnl != null ? getOutcomeFromPnl(pnl) : 'breakeven'

  if (loading) return null

  const handleFormSubmit = (data: FormData) => {
    const symbolId = Number(data.symbol)
    const lev = data.leverage != null && Number.isFinite(Number(data.leverage)) && Number(data.leverage) > 0
      ? Number(data.leverage)
      : 1
    const emotion = data.emotion_rating != null && Number.isFinite(Number(data.emotion_rating))
      ? Number(data.emotion_rating)
      : undefined
    const strategyId = data.strategy != null && Number.isFinite(Number(data.strategy))
      ? Number(data.strategy)
      : undefined
    const validTagIdSet = new Set((tags ?? []).map((t) => t.id))
    const submittedTagIds = data.tag_ids ?? []
    const sanitizedTagIds = submittedTagIds.filter((id) => validTagIdSet.has(id))
    onSubmit(
      {
        symbol: symbolId,
        side: data.side,
        entry_price: data.entry_price,
        exit_price: data.exit_price,
        amount_risked: data.amount_risked != null && Number.isFinite(Number(data.amount_risked)) ? Number(data.amount_risked) : undefined,
        entry_date: data.entry_date,
        exit_date: data.exit_date,
        pnl: data.pnl,
        leverage: lev,
        notes: data.notes || undefined,
        strategy: strategyId,
        tag_ids: sanitizedTagIds.length ? sanitizedTagIds : undefined,
        emotion_rating: emotion,
        emotion_notes: data.emotion_notes || undefined,
        pre_trade_plan: data.pre_trade_plan || undefined,
        post_trade_review: data.post_trade_review || undefined,
        is_paper: data.is_paper ?? false,
      },
      screenshotFile ?? undefined
    )
  }

  const handleInvalidSubmit = () => {
    const firstErrorField = Object.keys(form.formState.errors)[0]
    if (!firstErrorField) return
    const el = document.getElementById(firstErrorField)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  }

  const submitErrors = Object.entries(form.formState.errors)
    .map(([field, error]) => {
      const message = error?.message
      if (typeof message !== 'string' || !message.trim()) return null
      const labelMap: Record<string, string> = {
        symbol: 'Symbol',
        entry_price: 'Entry price',
        exit_price: 'Exit price',
        entry_date: 'Entry date',
        exit_date: 'Exit date',
        pnl: 'Profit amount',
        leverage: 'Leverage',
      }
      return `${labelMap[field] ?? field}: ${message}`
    })
    .filter((v): v is string => Boolean(v))

  const loadTemplate = async (template: TradeTemplate) => {
    setValue('side', template.side || 'long')
    setValue('strategy', template.strategy)
    setValue('tag_ids', template.tags?.map((t) => t.id) || [])
    setValue('notes', template.notes || '')
    setValue('pre_trade_plan', template.pre_trade_plan || '')
    setValue('is_paper', template.is_paper)
    setCalculationMethod(null)
    const name = (template.symbol || '').trim()
    if (name) {
      const existing = (symbols ?? []).find((s) => s.name.toLowerCase() === name.toLowerCase())
      if (existing) {
        setValue('symbol', existing.id)
      } else {
        try {
          const created = await symbolCreate(name)
          await queryClient.invalidateQueries({ queryKey: ['symbols'] })
          setValue('symbol', created.id)
        } catch {
          // leave symbol unchanged if create fails
        }
      }
    }
  }

  const handleSaveTemplate = () => {
    const formData = form.getValues()
    const symbolName = (symbols ?? []).find((s) => s.id === formData.symbol)?.name ?? ''
    saveTemplateMutation.mutate({
      name: templateName,
      symbol: symbolName,
      side: formData.side,
      strategy: formData.strategy ?? undefined,
      tag_ids: formData.tag_ids,
      notes: formData.notes,
      pre_trade_plan: formData.pre_trade_plan,
      is_paper: formData.is_paper,
    })
  }

  return (
    <>
      {templates && templates.length > 0 && !initial && (
        <div style={{ marginBottom: 'var(--space-4)', gridColumn: '1 / -1' }}>
          <div className="input-group">
            <label htmlFor="template-select">
              <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Load Template
            </label>
            <select
              id="template-select"
              className="select"
              value=""
              onChange={(e) => {
                const templateId = Number(e.target.value)
                if (templateId) {
                  const template = templates.find((t) => t.id === templateId)
                  if (template) loadTemplate(template)
                }
                e.target.value = ''
              }}
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => handleFormSubmit(data as FormData), handleInvalidSubmit)} className="form-grid">
        {apiError && (
          <div className="alert alert--error" style={{ gridColumn: '1 / -1' }}>
            {apiError}
          </div>
        )}
        {form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 && (
          <div className="alert alert--error" style={{ gridColumn: '1 / -1' }}>
            {submitErrors.length > 0
              ? `Please fix: ${submitErrors.join(' | ')}`
              : 'Please fix the form errors before creating the trade.'}
          </div>
        )}

        <div className="form-section" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="form-section__title" style={{ margin: 0 }}>Trade details</h2>
          {!initial && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSaveTemplateOpen(true)}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              <Save size={16} />
              Save as template
            </Button>
          )}
        </div>

        <div className="trade-form-details">
          <div className="trade-form-details__row trade-form-details__row--symbol-side">
            <div className="trade-form-details__block">
              <label htmlFor="symbol">Symbol</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <select
                  id="symbol"
                  className={`select ${form.formState.errors.symbol ? 'input--error' : ''}`}
                  value={symbolValue && symbolValue > 0 ? symbolValue : ''}
                  onChange={(e) => setValue('symbol', e.target.value === '' ? 0 : Number(e.target.value))}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="">Select symbol...</option>
                  {(symbols ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={() => setAddSymbolOpen(true)}>
                  Add symbol
                </Button>
              </div>
              {form.formState.errors.symbol?.message && (
                <span className="input-helper input-helper--error">{form.formState.errors.symbol.message}</span>
              )}
            </div>
            <div className="trade-form-details__block" style={{ minWidth: 100 }}>
              <label htmlFor="side">Side</label>
              <select id="side" className="select" {...register('side')}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>

          <div className="trade-form-details__row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="trade-form-details__block">
              <label>Trade type</label>
              <div
                className={`trade-type-slider ${isDragging ? 'trade-type-slider--dragging' : ''}`}
                role="slider"
                aria-label="Trade type"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={isPaper ? 1 : 0}
                aria-valuetext={isPaper ? 'Paper (simulated)' : 'Actual'}
                data-value={isPaper ? 'paper' : 'actual'}
                onPointerDown={handleSliderPointerDown}
              >
                <input
                  id="is_paper"
                  type="checkbox"
                  {...register('is_paper')}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <span className="trade-type-slider__label trade-type-slider__label--left">Actual</span>
                <div
                  ref={trackRef}
                  className="trade-type-slider__track"
                  onPointerMove={handleSliderPointerMove}
                  onPointerUp={handleSliderPointerUp}
                  onPointerCancel={handleSliderPointerUp}
                >
                  <div
                    className="trade-type-slider__fill"
                    style={{ width: `${sliderPosition * 100}%` }}
                  />
                  <div
                    className="trade-type-slider__thumb"
                    style={{ left: `${sliderPosition * 100}%` }}
                  />
                </div>
                <span className="trade-type-slider__label trade-type-slider__label--right">Paper (simulated)</span>
              </div>
              <span className="input-helper">Drag between actual and paper trade</span>
            </div>
          </div>

          <p className="trade-form-details__section-label">Prices &amp; dates</p>
          <div className="trade-form-details__row trade-form-details__row--2">
            <div className="input-group">
              <Input label="Entry price" id="entry_price" type="number" step="any" error={form.formState.errors.entry_price?.message} {...register('entry_price')} />
            </div>
            <div className="input-group">
              <Input label="Exit price" id="exit_price" type="number" step="any" error={form.formState.errors.exit_price?.message} {...register('exit_price')} />
            </div>
          </div>
          <div className="trade-form-details__row trade-form-details__row--2">
            <div className="input-group">
              <Input
                label="Amount invested"
                id="amount_invested"
                type="number"
                step="any"
                min={0}
                placeholder="e.g. 1000"
                error={form.formState.errors.amount_invested?.message}
                value={amountInvestedValue != null ? String(amountInvestedValue) : ''}
                onChange={(e) => setValue('amount_invested', e.target.value === '' ? null : Number(e.target.value))}
              />
              <span className="input-helper">Dollar amount invested</span>
            </div>
            <div className="input-group">
              <Input
                label="Amount risked"
                id="amount_risked"
                type="number"
                step="any"
                min={0}
                placeholder="Optional"
                error={form.formState.errors.amount_risked?.message}
                value={amountRiskedValue != null ? String(amountRiskedValue) : ''}
                onChange={(e) => setValue('amount_risked', e.target.value === '' ? null : Number(e.target.value))}
              />
              <span className="input-helper">Optional manual value</span>
            </div>
          </div>
          <div className="trade-form-details__row trade-form-details__row--2">
            <div className="input-group">
              <Input label="Entry date" id="entry_date" type="datetime-local" error={form.formState.errors.entry_date?.message} {...register('entry_date')} />
            </div>
            <div className="input-group">
              <Input label="Exit date" id="exit_date" type="datetime-local" error={form.formState.errors.exit_date?.message} {...register('exit_date')} />
            </div>
          </div>

          <p className="trade-form-details__section-label">Profit &amp; leverage</p>
          <div className="trade-form-details__row trade-form-details__row--3">
            <div className="input-group">
              <label htmlFor="pnl">Profit Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  id="pnl"
                  type="number"
                  step="any"
                  className={`input ${form.formState.errors.pnl ? 'input--error' : ''}`}
                  style={{ flex: 1 }}
                  value={pnl != null ? String(pnl) : ''}
                  onChange={(e) => {
                    setCalculationMethod('manual')
                    setValue('pnl', e.target.value === '' ? 0 : Number(e.target.value))
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleCalculatePnl}>
                  <Calculator size={16} />
                  Calculate
                </Button>
                {pnl != null && pnl !== 0 && (
                  <span
                    style={{
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-medium)',
                      whiteSpace: 'nowrap',
                      ...(pnlOutcome === 'win'
                        ? { background: 'var(--color-success-muted)', color: 'var(--color-success)' }
                        : pnlOutcome === 'loss'
                          ? { background: 'var(--color-error-muted)', color: 'var(--color-error)' }
                          : { background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }),
                    }}
                  >
                    {pnlOutcome === 'win' ? 'Win' : pnlOutcome === 'loss' ? 'Loss' : 'Breakeven'}
                  </span>
                )}
              </div>
              <span className="input-helper">
                {calculationMethod === 'amount' && 'Calculated from price change % × amount invested'}
                {calculationMethod === 'manual' && 'Manually entered profit amount'}
                {!calculationMethod && 'Click Calculate to compute from prices and amount invested'}
              </span>
              {form.formState.errors.pnl?.message && (
                <span className="input-helper input-helper--error">{form.formState.errors.pnl.message}</span>
              )}
            </div>
            {!isPaper && (
              <div className="input-group">
                <label htmlFor="leverage">Leverage</label>
                <input
                  id="leverage"
                  type="number"
                  min={0.01}
                  step="any"
                  className={`input ${form.formState.errors.leverage ? 'input--error' : ''}`}
                  value={leverageValue != null ? String(leverageValue) : '1'}
                  onChange={(e) => setValue('leverage', e.target.value === '' ? 1 : Number(e.target.value))}
                />
                <span className="input-helper">1 = none</span>
                {form.formState.errors.leverage?.message && (
                  <span className="input-helper input-helper--error">{form.formState.errors.leverage.message}</span>
                )}
              </div>
            )}
          </div>

          <p className="trade-form-details__section-label">Strategy &amp; tags</p>
          <div className="trade-form-details__row trade-form-details__row--2">
            <div className="input-group">
              <label htmlFor="strategy">Strategy</label>
              <select
                id="strategy"
                className="select"
                value={strategyValue ?? ''}
                onChange={(e) => setValue('strategy', e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">None</option>
                {(strategies ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="tag_ids">Tags</label>
              <select
                id="tag_ids"
                className="select"
                multiple
                value={tagIds.map(String)}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions, (o) => Number(o.value))
                  setValue('tag_ids', opts)
                }}
              >
                {(tags ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="input-helper">Hold Ctrl/Cmd to select multiple</span>
            </div>
          </div>
        </div>

      <div className="form-section" style={{ gridColumn: '1 / -1' }}>
        <h2 className="form-section__title">Screenshot & notes</h2>
      </div>
      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="screenshot">Screenshot</label>
        <input
          id="screenshot"
          type="file"
          accept="image/*"
          className="input"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
          onChange={(e) => handleScreenshotFile(e.target.files?.[0] ?? null)}
        />
        {(screenshotPreview || initial?.screenshot) ? (
            <div className="screenshot-upload-preview">
              <div className="screenshot-upload-preview__image-wrap">
                <ScreenshotView
                  src={screenshotPreview || initial?.screenshot || ''}
                  alt="Screenshot preview"
                  variant="preview"
                />
                <button
                  type="button"
                  className="screenshot-upload-preview__remove"
                  onClick={() => handleScreenshotFile(null)}
                  aria-label="Remove screenshot"
                >
                  <X size={18} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn--secondary"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={() => document.getElementById('screenshot')?.click()}
              >
                <Upload size={16} />
                Replace image
              </button>
            </div>
        ) : (
          <div
            className={`screenshot-upload-zone ${screenshotDragOver ? 'screenshot-upload-zone--active' : ''}`}
              onDrop={handleScreenshotDrop}
              onDragOver={handleScreenshotDragOver}
              onDragLeave={handleScreenshotDragLeave}
              onClick={() => document.getElementById('screenshot')?.click()}
            >
              <div className="screenshot-upload-zone__icon">
                <ImagePlus size={40} />
              </div>
              <p className="screenshot-upload-zone__text">
                Drag and drop your screenshot here, or click to browse
              </p>
            <p className="screenshot-upload-zone__hint">PNG, JPG or GIF</p>
          </div>
        )}
      </div>

      <Input label="Notes" id="notes" style={{ gridColumn: '1 / -1' }} {...register('notes')} />

      <div className="form-section" style={{ gridColumn: '1 / -1' }}>
        <h2 className="form-section__title">Review & reflection</h2>
      </div>
      <div className="input-group">
        <label htmlFor="emotion_rating">Emotion (1-5)</label>
        <select id="emotion_rating" className="select" {...register('emotion_rating', { valueAsNumber: true })}>
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <Input label="Emotion notes" id="emotion_notes" {...register('emotion_notes')} />
      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="pre_trade_plan">Pre-trade plan</label>
        <textarea id="pre_trade_plan" className="input" rows={2} {...register('pre_trade_plan')} />
      </div>
      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="post_trade_review">Post-trade review</label>
        <textarea id="post_trade_review" className="input" rows={2} {...register('post_trade_review')} />
      </div>
      <div className="form-actions">
        {cancelTo && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate(cancelTo)
              }
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>

    <Modal
      open={addSymbolOpen}
      onClose={() => {
        setAddSymbolOpen(false)
        setNewSymbolName('')
      }}
      title="Add symbol"
      footer={
        <>
          <Button variant="secondary" onClick={() => { setAddSymbolOpen(false); setNewSymbolName('') }} disabled={addSymbolMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const name = newSymbolName.trim()
              if (name) addSymbolMutation.mutate(name)
            }}
            disabled={addSymbolMutation.isPending || !newSymbolName.trim()}
          >
            {addSymbolMutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </>
      }
    >
      <div className="input-group">
        <label htmlFor="new-symbol-name">Symbol name</label>
        <Input
          id="new-symbol-name"
          value={newSymbolName}
          onChange={(e) => setNewSymbolName(e.target.value)}
          placeholder="e.g. AAPL"
          autoFocus
        />
      </div>
    </Modal>

    <Modal
      open={saveTemplateOpen}
      onClose={() => {
        setSaveTemplateOpen(false)
        setTemplateName('')
      }}
      title="Save as Template"
      footer={
        <>
          <Button variant="secondary" onClick={() => {
            setSaveTemplateOpen(false)
            setTemplateName('')
          }} disabled={saveTemplateMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveTemplate}
            disabled={saveTemplateMutation.isPending || !templateName.trim()}
          >
            {saveTemplateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="input-group">
        <label htmlFor="template-name">Template Name</label>
        <Input
          id="template-name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g., Swing Trade Setup"
          autoFocus
        />
        <span className="input-helper">Save current form values as a reusable template</span>
      </div>
    </Modal>
    </>
  )
}
