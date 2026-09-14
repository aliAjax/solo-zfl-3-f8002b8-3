import type { Bench, WorkOrder } from '@/types';

const STORAGE_KEY = 'bench-archive-data';
export const WORK_ORDER_STORAGE_KEY = 'bench-work-orders';

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load benches from localStorage:', error);
  }
  return [];
}

export function saveBenches(benches: Bench[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(benches));
  } catch (error) {
    console.error('Failed to save benches to localStorage:', error);
  }
}

export function clearBenches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear benches from localStorage:', error);
  }
}

/** 返回 null 表示从未初始化过（用于首次播种演示数据），空数组表示用户已清空 */
export function loadWorkOrders(): WorkOrder[] | null {
  try {
    const data = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load work orders from localStorage:', error);
  }
  return null;
}

export function saveWorkOrders(orders: WorkOrder[]): void {
  try {
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save work orders to localStorage:', error);
  }
}
