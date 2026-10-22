export type Measure = 'pcs' | 'kg' | 'm';
export interface Line { price: number; qty: number; measure: Measure; fee?: number; madeToOrder?: boolean }

/** Step allowed per measure; quantities must be multiples of the step. */
export const STEP: Record<Measure, number> = { pcs: 1, kg: 0.1, m: 0.1 };
export const MTO_MAX = 50;

export function isValidQty(qty: number, measure: Measure): boolean {
  if (!Number.isFinite(qty) || qty <= 0) return false;
  const step = STEP[measure];
  return Math.abs(Math.round(qty / step) * step - qty) < 1e-9;
}

/** Total for one line: price per unit times quantity, plus a per-unit fee for piece goods. */
export function lineTotal(line: Line): number {
  if (!isValidQty(line.qty, line.measure)) throw new Error(`Invalid quantity ${line.qty} for ${line.measure}`);
  if (line.madeToOrder && line.qty > MTO_MAX) throw new Error(`Made-to-order quantity exceeds ${MTO_MAX}`);
  const fee = line.measure === 'pcs' ? (line.fee ?? 0) * line.qty : 0;
  return Math.round((line.price * line.qty + fee) * 100) / 100;
}

export function applyDiscount(total: number, percent: number): number {
  if (percent < 0 || percent > 100) throw new Error('percent must be between 0 and 100');
  return Math.round(total * (1 - percent / 100) * 100) / 100;
}

export function formatQty(qty: number, measure: Measure): string {
  if (measure === 'pcs') return `${qty} pcs`;
  return `${qty.toFixed(1).replace('.', ',')} ${measure}`;
}
