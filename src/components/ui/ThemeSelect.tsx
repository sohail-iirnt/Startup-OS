import {useEffect,useRef,useState} from 'react'
import {Check,ChevronDown} from 'lucide-react'

type Option={value:string;label:string}

export default function ThemeSelect({value,onChange,options,placeholder='Select…',className=''}:{value:string;onChange:(value:string)=>void;options:Option[];placeholder?:string;className?:string}){
  const [open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(!open)return;const close=(event:MouseEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[open])
  const selected=options.find(option=>option.value===value)
  return <div ref={ref} className={`relative ${className}`}>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(current=>!current)} className="os-focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-2.5 text-left text-sm text-[var(--os-text)] shadow-[var(--os-shadow-sm)] transition-all hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]">
      <span className={selected?'truncate':'truncate text-[var(--os-text-muted)]'}>{selected?.label||placeholder}</span><ChevronDown size={16} className={`shrink-0 text-[var(--os-text-muted)] transition-transform ${open?'rotate-180':''}`}/>
    </button>
    {open&&<div role="listbox" className="absolute left-0 top-[calc(100%+6px)] z-[120] max-h-72 w-full overflow-y-auto rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-surface-raised)] p-1.5 shadow-[var(--os-shadow-lg)]">
      {options.map(option=><button key={option.value} type="button" role="option" aria-selected={option.value===value} onClick={()=>{onChange(option.value);setOpen(false)}} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${option.value===value?'bg-[var(--os-accent-soft)] font-semibold text-[var(--os-accent)]':'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]'}`}><span className="truncate">{option.label}</span>{option.value===value&&<Check size={15} className="shrink-0"/>}</button>)}
    </div>}
  </div>
}
