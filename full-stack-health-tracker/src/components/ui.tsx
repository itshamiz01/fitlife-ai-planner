"use client";
import { weightChartBounds } from "@/lib/weight-progress";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Plus, Leaf, Droplets, Check, ArrowUpRight, LoaderCircle, Pencil, Trash2, ChevronRight } from "lucide-react";
import type { Meal, WeightLog } from "@/lib/types";

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? "brand-small" : ""}`}><span className="brand-mark"><Leaf size={22} strokeWidth={2.1} /></span><span className="brand-wordmark">Fit Life <strong>Bro</strong></span></span>;
}
export function Button({ children, className = "", variant = "primary", loading = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean }) {
  return <button className={`btn btn-${variant} ${className}`} {...props} disabled={loading || props.disabled}>{loading && <LoaderCircle className="spin" size={16} />}{children}</button>;
}
export function SectionHeading({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</div>;
}
export function EmptyState({ title, description, action, label = "Add an entry" }: { title: string; description: string; action?: () => void; label?: string }) {
  return <div className="empty-state"><span className="empty-icon"><Leaf size={27} /></span><h3>{title}</h3><p>{description}</p>{action && <Button onClick={action}><Plus size={16} />{label}</Button>}</div>;
}
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} disabled={disabled} className={`toggle ${checked ? "is-on" : ""}`}><span /></button>;
}
export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    const timer = setTimeout(() => el?.querySelector<HTMLElement>("input, select, textarea, button")?.focus(), 40);
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && el) {
        const items = Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]'));
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", key);
    return () => { clearTimeout(timer); document.body.style.overflow = old; document.removeEventListener("keydown", key); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`modal ${wide ? "modal-wide" : ""}`}><div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>{children}</div></div>;
}
export function Ring({ value, max, size = 138, children }: { value: number; max: number; size?: number; children?: ReactNode }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return <div className="water-ring" style={{ width: size, height: size }}><svg viewBox="0 0 120 120" aria-label={`${Math.round(value / max * 100)}% of water goal`}><circle cx="60" cy="60" r={radius} fill="none" stroke="#e8f2f8" strokeWidth="7" /><circle cx="60" cy="60" r={radius} fill="none" stroke="#79b9df" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.min(value / max, 1))} transform="rotate(-90 60 60)" /></svg><div className="ring-center">{children || <><Droplets size={27} strokeWidth={1.7} /><strong>{Math.round(value / max * 100)}<small>%</small></strong><span>of daily goal</span></>}</div></div>;
}
export { MealCard } from "./budget-meal-card";
export function WeightChart({ logs, target, compact = false }: { logs: WeightLog[]; target: number; compact?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return <div className="chart-empty">Your first check-in is the beginning of your story.</div>;
  const { min, max } = weightChartBounds(sorted.map(log => log.weight), target);
  const width = 600, height = compact ? 155 : 240, left = 36, right = 15, top = 20, bottom = 29;
  const x = (i: number) => left + i / Math.max(1, sorted.length - 1) * (width - left - right);
  const y = (weight: number) => top + (max - weight) / (max - min) * (height - top - bottom);
  const points = sorted.map((log, i) => `${x(i)},${y(log.weight)}`).join(" ");
  const id = compact ? "weight-fill-small" : "weight-fill-large";
  return <div className="weight-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weight progress chart"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#85b498" stopOpacity=".23" /><stop offset="100%" stopColor="#85b498" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3].map(i => { const value = min + (max - min) * i / 3; return <g key={i}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="#edf0eb" strokeDasharray="4 4" /><text x="2" y={y(value) + 4} fill="#969f96" fontSize="10">{value.toFixed(0)}</text></g>; })}<line x1={left} x2={width - right} y1={y(target)} y2={y(target)} stroke="#b8cdbb" strokeDasharray="4 4" /><polygon points={`${left},${height - bottom} ${points} ${x(sorted.length - 1)},${height - bottom}`} fill={`url(#${id})`} /><polyline points={points} stroke="#4b8a62" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />{sorted.map((log, i) => <g key={log.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}><circle cx={x(i)} cy={y(log.weight)} r={hover === i ? 5 : 3.2} fill="#fff" stroke="#4b8a62" strokeWidth="2" /><circle cx={x(i)} cy={y(log.weight)} r="13" fill="transparent"><title>{log.date}: {log.weight} kg</title></circle>{(i === 0 || i === sorted.length - 1 || !compact && i % 2 === 0) && <text x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === sorted.length - 1 ? "end" : "middle"} fill="#969f96" fontSize="10">{new Date(`${log.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</text>}</g>)}</svg>{hover !== null && <div className="chart-tooltip">{sorted[hover].weight} kg · {sorted[hover].date}</div>}</div>;
}
export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="text-link" onClick={onClick}>{children}<ChevronRight size={15} /></button>; }
export function PlantIllustration() {
  return <svg className="plant-illustration" viewBox="0 0 130 116" fill="none" aria-hidden="true"><ellipse cx="66" cy="104" rx="39" ry="5" fill="#dce8d8" /><path d="M52 73h29l-5 29H58z" fill="#e7cdb0" /><path d="M49 72h35v7H49z" fill="#f0d9bf" /><path d="M66 74V28M66 61L45 43M66 51l20-19" stroke="#5b8052" strokeWidth="2" /><path d="M65 46c-18 2-30-10-28-25 17-1 30 10 28 25" fill="#7eaa71" /><path d="M67 33c-9-13-6-26 5-31 10 13 6 26-5 31" fill="#96b77c" /><path d="M67 57c1-19 13-29 28-25 0 17-12 27-28 25" fill="#588652" /><path d="M65 65c-17 1-27-9-24-20 13 0 24 7 24 20" fill="#a8c196" /><path d="M68 70c2-14 12-21 23-17-2 13-10 20-23 17" fill="#83a576" /></svg>;
}
