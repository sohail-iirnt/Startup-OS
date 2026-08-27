import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Download, Eye, Pencil, Plus, ReceiptText, Trash2, WalletCards } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import ThemeSelect from '../components/ui/ThemeSelect'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { getWorkspaceMembers } from '../services/memberService'
import { deletePayroll, savePayroll, subscribeToPayroll } from '../services/payrollService'
import type { PayrollForm, PayrollRecord } from '../types/payroll'
import type { WorkspaceMember } from '../types/workspace'

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm: PayrollForm = { paidToUserId: '', paidTo: '', recipientType: 'intern', paymentType: 'stipend', customPaymentType: '', paidDate: today(), paymentMethod: 'online', paidBy: '', periodStart: '', periodEnd: '', baseAmount: '', incentiveAmount: '', notes: '' }
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
const dateValue = (value: unknown) => value instanceof Date ? value : value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function' ? (value as { toDate: () => Date }).toDate() : new Date(String(value ?? ''))
const inputClass = 'w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]'

export default function Payroll() {
  const { user } = useAuth()
  const { workspace, workspaceLoading, hasPermission } = useWorkspace()
  const canManage = hasPermission('payroll.manage')
  const canExport = hasPermission('finance.export')
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [form, setForm] = useState<PayrollForm>(emptyForm)
  const [editing, setEditing] = useState<PayrollRecord | null>(null)
  const [detail, setDetail] = useState<PayrollRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PayrollRecord | null>(null)
  const [period, setPeriod] = useState('all')
  const [person, setPerson] = useState('all')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (workspaceLoading || !workspace?.id) return undefined
    return subscribeToPayroll(workspace.id, setRecords, () => setError('Payroll records could not be loaded.'))
  }, [workspace?.id, workspaceLoading])

  useEffect(() => {
    if (workspaceLoading || !workspace?.id) return
    getWorkspaceMembers(workspace.id).then(setMembers).catch(() => setError('Team members could not be loaded.'))
  }, [workspace?.id, workspaceLoading])

  const filtered = useMemo(() => {
    const now = new Date()
    return records.filter(record => {
      const date = dateValue(record.paidDate)
      const personMatch = person === 'all' || record.paidToUserId === person || record.paidTo === person
      let dateMatch = true
      if (period === 'month') dateMatch = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      if (period === 'year') dateMatch = date.getFullYear() === now.getFullYear()
      return personMatch && dateMatch
    })
  }, [records, period, person])

  const total = useMemo(() => filtered.reduce((sum, record) => sum + record.totalAmount, 0), [filtered])
  const currentMonth = useMemo(() => records.filter(record => { const d = dateValue(record.paidDate); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((sum, record) => sum + record.totalAmount, 0), [records])
  const average = filtered.length ? total / filtered.length : 0
  const computedTotal = Number(form.baseAmount || 0) + Number(form.incentiveAmount || 0)

  function selectMember(value: string) {
    const member = members.find(item => item.userId === value)
    setForm(current => ({ ...current, paidToUserId: value, paidTo: member?.displayName || member?.email || '', recipientType: member?.role === 'intern' ? 'intern' : member?.role === 'member' ? 'member' : member?.role === 'manager' ? 'employee' : current.recipientType }))
  }

  function startEdit(record: PayrollRecord) {
    const paidDate = dateValue(record.paidDate)
    setEditing(record)
    setForm({ paidToUserId: record.paidToUserId || '', paidTo: record.paidTo, recipientType: record.recipientType, paymentType: ['salary', 'stipend', 'referral'].includes(record.paymentType) ? record.paymentType : 'custom', customPaymentType: record.customPaymentType || (record.paymentType === 'custom' ? '' : ''), paidDate: paidDate.toISOString().slice(0, 10), paymentMethod: record.paymentMethod, paidBy: record.paidBy, periodStart: record.periodStart || '', periodEnd: record.periodEnd || '', baseAmount: String(record.baseAmount), incentiveAmount: String(record.incentiveAmount || ''), notes: record.notes || '' })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!workspace?.id || !user?.uid || !canManage) return
    setSaving(true); setError('')
    try {
      await savePayroll(workspace.id, user.uid, form, editing?.id)
      setEditing(null); setForm(emptyForm)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save payroll.') } finally { setSaving(false) }
  }

  async function remove() {
    if (!deleteTarget || !canManage) return
    setDeleting(true); setError('')
    try { await deletePayroll(deleteTarget.id); setDeleteTarget(null); setDetail(null) } catch { setError('Could not delete payroll record.') } finally { setDeleting(false) }
  }

  function exportPayroll() {
    if (!canExport) return
    const rows = filtered.map(r => `<tr><td>${dateValue(r.paidDate).toLocaleDateString('en-IN')}</td><td>${r.paidTo}</td><td>${r.recipientType}</td><td>${r.paymentType === 'custom' ? r.customPaymentType || 'Other' : r.paymentType}</td><td>${r.paymentMethod}</td><td>${r.periodStart || '-'} ${r.periodEnd ? '→ ' + r.periodEnd : ''}</td><td>${money(r.totalAmount)}</td></tr>`).join('')
    const win = window.open('', '_blank', 'width=1100,height=800'); if (!win) return
    win.document.write(`<html><head><title>Startup OS Payroll Report</title><style>body{font-family:Arial;padding:30px;color:#111}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left}th{background:#f2f2f2}</style></head><body><h1>Payroll Report</h1><p>Generated ${new Date().toLocaleString('en-IN')}</p><table><thead><tr><th>Date</th><th>Paid To</th><th>Type</th><th>Payment For</th><th>Method</th><th>Period</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><h3>Total paid: ${money(total)}</h3><script>window.print()</script></body></html>`); win.document.close()
  }

  return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
    <SectionHeader title="Payroll" description="Track salaries, stipends, referrals and every team payment as a controlled financial record." />
    {error && <div className="mt-5 rounded-xl bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><StatCard label="Filtered paid" value={money(total)} description={`${filtered.length} payment records`} icon={<WalletCards size={19} />} /><StatCard label="This month" value={money(currentMonth)} description="All payroll payments" icon={<ReceiptText size={19} />} /><StatCard label="Average payment" value={money(average)} description="Across current filter" icon={<WalletCards size={19} />} /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[440px_1fr]">
      {canManage && <Card className="p-6"><SectionHeader title={editing ? 'Edit payroll payment' : 'Record payroll payment'} description="Every saved payroll payment also appears automatically in Finance → Expenses as Payroll." /><form onSubmit={submit} className="mt-5 space-y-3">
        <ThemeSelect value={form.paidToUserId} onChange={selectMember} options={[{ value: '', label: 'Select team member' }, ...members.map(member => ({ value: member.userId, label: `${member.displayName || member.email} · ${member.role}` }))]} />
        <input required value={form.paidTo} onChange={e => setForm(f => ({ ...f, paidTo: e.target.value }))} placeholder="Paid to (manual name allowed)" className={inputClass} />
        <ThemeSelect value={form.recipientType} onChange={value => setForm(f => ({ ...f, recipientType: value as PayrollForm['recipientType'] }))} options={['intern', 'member', 'employee', 'freelancer', 'other'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
        <ThemeSelect value={form.paymentType} onChange={value => setForm(f => ({ ...f, paymentType: value as PayrollForm['paymentType'] }))} options={[{ value: 'salary', label: 'Salary' }, { value: 'stipend', label: 'Stipend' }, { value: 'referral', label: 'Referral' }, { value: 'custom', label: 'Other / type manually' }]} />
        {form.paymentType === 'custom' && <input required value={form.customPaymentType} onChange={e => setForm(f => ({ ...f, customPaymentType: e.target.value }))} placeholder="Custom payment type" className={inputClass} />}
        <div className="grid grid-cols-2 gap-3"><input required type="number" min="0.01" step="0.01" value={form.baseAmount} onChange={e => setForm(f => ({ ...f, baseAmount: e.target.value }))} placeholder="Base amount ₹" className={inputClass} /><input type="number" min="0" step="0.01" value={form.incentiveAmount} onChange={e => setForm(f => ({ ...f, incentiveAmount: e.target.value }))} placeholder="Incentive ₹ (optional)" className={inputClass} /></div>
        <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-hover)] px-4 py-3"><p className="text-xs text-[var(--os-text-muted)]">Automatic total</p><p className="mt-1 text-xl font-bold text-[var(--os-text)]">{money(computedTotal)}</p></div>
        <input required type="date" value={form.paidDate} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))} className={inputClass} />
        <ThemeSelect value={form.paymentMethod} onChange={value => setForm(f => ({ ...f, paymentMethod: value as PayrollForm['paymentMethod'] }))} options={[{ value: 'cash', label: 'Cash' }, { value: 'online', label: 'Online' }]} />
        <input required value={form.paidBy} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))} placeholder="Paid by" className={inputClass} />
        <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs text-[var(--os-text-muted)]">Period from</label><input type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} className={inputClass} /></div><div><label className="mb-1 block text-xs text-[var(--os-text-muted)]">Period to</label><input type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} className={inputClass} /></div></div>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes / payment details" rows={3} className={inputClass} />
        <div className="flex gap-2"><Button type="submit" disabled={saving} className="flex-1"><Plus size={16} />{saving ? 'Saving…' : editing ? 'Save changes' : 'Record payment'}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(emptyForm) }}>Cancel</Button>}</div>
      </form></Card>}
      <Card className="min-w-0 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><SectionHeader title="Payroll ledger" description={`${filtered.length} records`} /><div className="flex flex-wrap gap-2"><ThemeSelect value={person} onChange={setPerson} options={[{ value: 'all', label: 'All people' }, ...members.map(m => ({ value: m.userId, label: m.displayName || m.email }))]} className="min-w-[170px]" /><ThemeSelect value={period} onChange={setPeriod} options={[{ value: 'all', label: 'All dates' }, { value: 'month', label: 'This month' }, { value: 'year', label: 'This year' }]} className="min-w-[140px]" />{canExport && <button type="button" onClick={exportPayroll} className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]"><Download size={14} />Export PDF</button>}</div></div>
        <div className="mt-5 space-y-2">{filtered.length ? filtered.map(record => <button key={record.id} type="button" onClick={() => setDetail(record)} className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-left hover:bg-[var(--os-surface-hover)]"><div className="min-w-0"><p className="truncate text-sm font-semibold">{record.paidTo}</p><p className="mt-1 truncate text-xs text-[var(--os-text-muted)]">{record.paymentType === 'custom' ? record.customPaymentType : record.paymentType} · {record.recipientType} · {dateValue(record.paidDate).toLocaleDateString('en-IN')}</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-sm font-bold text-[var(--os-danger)]">-{money(record.totalAmount)}</span><Eye size={15} /></div></button>) : <div className="rounded-2xl border border-dashed border-[var(--os-border)] p-12 text-center text-sm text-[var(--os-text-muted)]">No payroll records match this filter.</div>}</div>
      </Card>
    </div>
    {detail && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setDetail(null)}><Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Payroll payment</p><h2 className="mt-1 text-xl font-bold">{detail.paidTo}</h2></div><button type="button" onClick={() => setDetail(null)} className="text-[var(--os-text-muted)]">✕</button></div><div className="mt-6 grid grid-cols-2 gap-3 text-sm">{[['Payment type', detail.paymentType === 'custom' ? detail.customPaymentType || 'Other' : detail.paymentType], ['Recipient', detail.recipientType], ['Paid date', dateValue(detail.paidDate).toLocaleDateString('en-IN')], ['Method', detail.paymentMethod], ['Paid by', detail.paidBy], ['Base amount', money(detail.baseAmount)], ['Incentive', money(detail.incentiveAmount)], ['Total', money(detail.totalAmount)], ['Period', detail.periodStart && detail.periodEnd ? `${detail.periodStart} → ${detail.periodEnd}` : 'Not specified']].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-hover)] p-3"><p className="text-[10px] uppercase tracking-wider text-[var(--os-text-muted)]">{label}</p><p className="mt-1 font-semibold capitalize">{value}</p></div>)}</div>{detail.notes && <div className="mt-4 rounded-xl border border-[var(--os-border)] p-4 text-sm"><p className="text-xs text-[var(--os-text-muted)]">Notes</p><p className="mt-1 whitespace-pre-wrap">{detail.notes}</p></div>}<div className="mt-5 flex flex-wrap justify-end gap-2">{canManage && <><Button type="button" variant="secondary" onClick={() => { startEdit(detail); setDetail(null) }}><Pencil size={15} />Edit</Button><Button type="button" variant="danger" onClick={() => setDeleteTarget(detail)}><Trash2 size={15} />Delete</Button></>}</div></Card></div>}
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete payroll record?" description="This removes the payroll record and its linked Finance payroll ledger entry." confirmLabel={deleting ? 'Deleting…' : 'Delete payment'} onConfirm={remove} onCancel={() => !deleting && setDeleteTarget(null)} />
  </div>
}
