import type { SeverityType, WorkOrder } from '@/types';

/** 各严重程度要求的整改完成天数（自发现日期起算） */
export const SEVERITY_DEADLINE_DAYS: Record<SeverityType, number> = {
  severe: 3,
  normal: 7,
  minor: 15,
};

export function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return formatDateStr(new Date());
}

export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateStr(d);
}

export function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateStr(date);
}

/** toStr - fromStr 的天数差 */
export function diffDays(fromStr: string, toStr: string): number {
  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t2 - t1) / 86400000);
}

/** 整改截止日期 = 发现日期 + 严重程度对应天数 */
export function getDeadlineStr(order: Pick<WorkOrder, 'foundDate' | 'severity'>): string {
  return addDaysStr(order.foundDate, SEVERITY_DEADLINE_DAYS[order.severity]);
}

/**
 * 逾期判断（按发现日期起算）：
 * - 已关闭的工单不再标记逾期；
 * - 待复检的工单看整改完成日期是否超过截止日；
 * - 其余未结工单看今天是否已超过截止日。
 */
export function isOrderOverdue(order: WorkOrder): boolean {
  if (order.status === 'closed') return false;
  const deadline = getDeadlineStr(order);
  if (order.status === 'review' && order.completedDate) {
    return order.completedDate > deadline;
  }
  return todayStr() > deadline;
}

/** 已逾期的天数（未逾期返回 0） */
export function getOverdueDays(order: WorkOrder): number {
  if (!isOrderOverdue(order)) return 0;
  const deadline = getDeadlineStr(order);
  if (order.status === 'review' && order.completedDate) {
    return diffDays(deadline, order.completedDate);
  }
  return diffDays(deadline, todayStr());
}

/** 距整改截止日的剩余天数（可为负，负数即已逾期） */
export function getRemainingDays(order: Pick<WorkOrder, 'foundDate' | 'severity'>): number {
  return diffDays(todayStr(), getDeadlineStr(order));
}

/** 生成工单编号：WO-日期-序号，按当天已有工单递增 */
export function generateOrderNo(existing: { orderNo: string }[], dateStr: string): string {
  const prefix = `WO-${dateStr.replace(/-/g, '')}-`;
  let seq = existing.filter((o) => o.orderNo.startsWith(prefix)).length + 1;
  let no = `${prefix}${String(seq).padStart(3, '0')}`;
  while (existing.some((o) => o.orderNo === no)) {
    seq += 1;
    no = `${prefix}${String(seq).padStart(3, '0')}`;
  }
  return no;
}

export function formatDateCn(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}
