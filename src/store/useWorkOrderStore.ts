import { create } from 'zustand';
import { useEffect } from 'react';
import type { DefectCategoryType, SeverityType, TimelineAction, WorkOrder } from '@/types';
import { WORK_ORDER_STATUS_LABELS } from '@/types';
import { loadWorkOrders, saveWorkOrders, WORK_ORDER_STORAGE_KEY } from '@/utils/storage';
import { generateId } from '@/utils/comfort';
import { generateOrderNo, todayStr } from '@/utils/workOrder';
import { buildMockWorkOrders } from '@/data/mockWorkOrders';
import { useBenchStore } from './useBenchStore';

export interface CreateOrderInput {
  benchId: string;
  category: DefectCategoryType;
  severity: SeverityType;
  description: string;
  foundDate: string;
}

export type WorkOrderResult = { ok: true } | { ok: false; message: string };
export type CreateOrderResult = { ok: true; order: WorkOrder } | { ok: false; message: string };

interface WorkOrderState {
  orders: WorkOrder[];
  initialized: boolean;
}

interface WorkOrderActions {
  initialize: () => void;
  createOrder: (input: CreateOrderInput) => CreateOrderResult;
  /** 待整改 → 整改中 */
  startFixing: (id: string) => WorkOrderResult;
  /** 整改中 → 待复检（需整改人和完成日期） */
  submitRectification: (id: string, assignee: string, completedDate: string) => WorkOrderResult;
  /** 待复检 → 已关闭（通过）或退回整改中（不通过） */
  reviewOrder: (id: string, passed: boolean, note?: string) => WorkOrderResult;
  deleteOrdersByBench: (benchId: string) => void;
}

function makeTimeline(action: TimelineAction, operator?: string, note?: string) {
  return { id: generateId(), action, time: new Date().toISOString(), operator, note };
}

const CLOSED_MESSAGE = '工单已关闭，不能再进行操作';

export const useWorkOrderStore = create<WorkOrderState & WorkOrderActions>((set, get) => {
  const persist = (orders: WorkOrder[]) => {
    set({ orders });
    saveWorkOrders(orders);
  };

  /**
   * 写入前重新读取 localStorage 中的最新工单数据。
   * 多个标签页各自持有内存副本，直接基于内存判断并整表写回会互相覆盖；
   * 所有写操作都改为「重读 → 校验 → 基于最新数据写回」，
   * 保证其他标签页已创建的工单不被覆盖、冲突判断基于最新状态。
   */
  const readLatest = (): WorkOrder[] => loadWorkOrders() ?? get().orders;

  const applyTo = (latest: WorkOrder[], id: string, updater: (order: WorkOrder) => WorkOrder) => {
    persist(latest.map((o) => (o.id === id ? updater(o) : o)));
  };

  return {
    orders: [],
    initialized: false,

    initialize: () => {
      if (!useBenchStore.getState().initialized) {
        useBenchStore.getState().initialize();
      }
      const stored = loadWorkOrders();
      if (stored !== null) {
        set({ orders: stored, initialized: true });
        return;
      }
      // 首次运行：播种演示工单（只保留长椅仍存在的）
      const benchIds = new Set(useBenchStore.getState().benches.map((b) => b.id));
      const seeds = buildMockWorkOrders().filter((o) => benchIds.has(o.benchId));
      persist(seeds);
      set({ initialized: true });
    },

    createOrder: (input) => {
      const bench = useBenchStore.getState().benches.find((b) => b.id === input.benchId);
      if (!bench) return { ok: false, message: '长椅不存在，无法开单' };
      if (!input.foundDate) return { ok: false, message: '请选择发现日期' };
      if (input.foundDate > todayStr()) return { ok: false, message: '发现日期不能晚于今天' };

      // 重读最新数据再判断是否已有未结工单，避免与其他标签页并发开单互相覆盖
      const latest = readLatest();
      const open = latest.find((o) => o.benchId === input.benchId && o.status !== 'closed');
      if (open) {
        // 保留先创建的工单；把最新数据同步进本侧，让对方工单及其编号在本页可见
        set({ orders: latest });
        return {
          ok: false,
          message: `该长椅已有未结工单 ${open.orderNo}（${WORK_ORDER_STATUS_LABELS[open.status]}），请先处理完毕再开新单`,
        };
      }

      const now = new Date().toISOString();
      const order: WorkOrder = {
        id: generateId(),
        orderNo: generateOrderNo(latest, todayStr()),
        benchId: input.benchId,
        category: input.category,
        severity: input.severity,
        description: input.description.trim(),
        foundDate: input.foundDate,
        status: 'pending',
        timeline: [makeTimeline('create')],
        createdAt: now,
        updatedAt: now,
      };
      persist([order, ...latest]);
      return { ok: true, order };
    },

    startFixing: (id) => {
      const latest = readLatest();
      const order = latest.find((o) => o.id === id);
      if (!order) return { ok: false, message: '工单不存在' };
      if (order.status === 'closed') return { ok: false, message: CLOSED_MESSAGE };
      if (order.status === 'fixing') return { ok: false, message: '工单已在整改中，无需重复操作' };
      if (order.status === 'review') return { ok: false, message: '工单正在待复检，不能回退到整改中' };

      applyTo(latest, id, (o) => ({
        ...o,
        status: 'fixing',
        updatedAt: new Date().toISOString(),
        timeline: [...o.timeline, makeTimeline('start')],
      }));
      return { ok: true };
    },

    submitRectification: (id, assignee, completedDate) => {
      const latest = readLatest();
      const order = latest.find((o) => o.id === id);
      if (!order) return { ok: false, message: '工单不存在' };
      if (order.status === 'closed') return { ok: false, message: CLOSED_MESSAGE };
      if (order.status === 'pending') {
        return { ok: false, message: '工单尚未开始整改，不能跳步提交，请先点击「开始整改」' };
      }
      if (order.status === 'review') {
        return { ok: false, message: '整改已提交，正在等待复检，请勿重复提交' };
      }

      const name = assignee.trim();
      if (!name) return { ok: false, message: '请填写整改人' };
      if (!completedDate) return { ok: false, message: '请选择完成日期' };
      if (completedDate < order.foundDate) {
        return { ok: false, message: `完成日期不能早于发现日期（${order.foundDate}）` };
      }
      if (completedDate > todayStr()) {
        return { ok: false, message: '完成日期不能晚于今天' };
      }

      applyTo(latest, id, (o) => ({
        ...o,
        status: 'review',
        assignee: name,
        completedDate,
        updatedAt: new Date().toISOString(),
        timeline: [...o.timeline, makeTimeline('submit', name, `完成日期：${completedDate}`)],
      }));
      return { ok: true };
    },

    reviewOrder: (id, passed, note) => {
      const latest = readLatest();
      const order = latest.find((o) => o.id === id);
      if (!order) return { ok: false, message: '工单不存在' };
      if (order.status === 'closed') return { ok: false, message: CLOSED_MESSAGE };
      if (order.status === 'pending') return { ok: false, message: '工单还未开始整改，不能跳步到复检' };
      if (order.status === 'fixing') return { ok: false, message: '整改尚未提交，不能跳步到复检' };

      const now = new Date().toISOString();
      const trimmedNote = note?.trim() || undefined;
      applyTo(latest, id, (o) => ({
        ...o,
        status: passed ? 'closed' : 'fixing',
        closedAt: passed ? now : undefined,
        updatedAt: now,
        timeline: [
          ...o.timeline,
          makeTimeline(passed ? 'review_pass' : 'review_reject', undefined, trimmedNote),
        ],
      }));
      return { ok: true };
    },

    deleteOrdersByBench: (benchId) => {
      persist(readLatest().filter((o) => o.benchId !== benchId));
    },
  };
});

// 其他标签页写入工单数据时同步到本页内存（storage 事件只在非写入方标签页触发）
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === WORK_ORDER_STORAGE_KEY) {
      const latest = loadWorkOrders();
      if (latest !== null) {
        useWorkOrderStore.setState({ orders: latest });
      }
    }
  });
}

/** 在组件中确保工单数据已加载（幂等） */
export function useInitWorkOrders() {
  const initialized = useWorkOrderStore((s) => s.initialized);
  const initialize = useWorkOrderStore((s) => s.initialize);
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);
}
