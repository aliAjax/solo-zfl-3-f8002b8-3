import type { WorkOrder } from '@/types';
import { generateId } from '@/utils/comfort';
import { daysAgoIso, daysAgoStr, generateOrderNo } from '@/utils/workOrder';

/**
 * 首次启动时的演示工单，日期相对当天计算，
 * 覆盖 待整改（已逾期）/ 整改中 / 待复检 / 已关闭 四种状态。
 */
export function buildMockWorkOrders(): WorkOrder[] {
  const orders: WorkOrder[] = [];

  // 1. 严重 · 待整改：发现于 5 天前，期限 3 天 → 已逾期
  const o1Found = daysAgoStr(5);
  orders.push({
    id: generateId(),
    orderNo: generateOrderNo(orders, o1Found),
    benchId: 'bench-002',
    category: 'safety',
    severity: 'severe',
    description: '扶手连接处螺丝松动，椅面晃动明显，存在夹手风险。',
    foundDate: o1Found,
    status: 'pending',
    timeline: [{ id: generateId(), action: 'create', time: daysAgoIso(5) }],
    createdAt: daysAgoIso(5),
    updatedAt: daysAgoIso(5),
  });

  // 2. 一般 · 整改中：发现于 4 天前，期限 7 天
  const o2Found = daysAgoStr(4);
  orders.push({
    id: generateId(),
    orderNo: generateOrderNo(orders, o2Found),
    benchId: 'bench-003',
    category: 'structure',
    severity: 'normal',
    description: '石凳一角开裂，边缘有碎屑脱落。',
    foundDate: o2Found,
    status: 'fixing',
    timeline: [
      { id: generateId(), action: 'create', time: daysAgoIso(4) },
      { id: generateId(), action: 'start', time: daysAgoIso(3) },
    ],
    createdAt: daysAgoIso(4),
    updatedAt: daysAgoIso(3),
  });

  // 3. 轻微 · 待复检：发现于 10 天前，期限 15 天，2 天前完成整改
  const o3Found = daysAgoStr(10);
  orders.push({
    id: generateId(),
    orderNo: generateOrderNo(orders, o3Found),
    benchId: 'bench-001',
    category: 'surface',
    severity: 'minor',
    description: '椅面木条漆面磨损，有两处明显划痕。',
    foundDate: o3Found,
    status: 'review',
    assignee: '李师傅',
    completedDate: daysAgoStr(2),
    timeline: [
      { id: generateId(), action: 'create', time: daysAgoIso(10) },
      { id: generateId(), action: 'start', time: daysAgoIso(8) },
      { id: generateId(), action: 'submit', time: daysAgoIso(2), operator: '李师傅', note: `完成日期：${daysAgoStr(2)}` },
    ],
    createdAt: daysAgoIso(10),
    updatedAt: daysAgoIso(2),
  });

  // 4. 一般 · 已关闭：按期整改完成，复检通过
  const o4Found = daysAgoStr(20);
  orders.push({
    id: generateId(),
    orderNo: generateOrderNo(orders, o4Found),
    benchId: 'bench-005',
    category: 'hygiene',
    severity: 'normal',
    description: '椅面及缝隙有食物残渣和污渍，需深度清洁。',
    foundDate: o4Found,
    status: 'closed',
    assignee: '王师傅',
    completedDate: daysAgoStr(16),
    closedAt: daysAgoIso(15),
    timeline: [
      { id: generateId(), action: 'create', time: daysAgoIso(20) },
      { id: generateId(), action: 'start', time: daysAgoIso(18) },
      { id: generateId(), action: 'submit', time: daysAgoIso(16), operator: '王师傅', note: `完成日期：${daysAgoStr(16)}` },
      { id: generateId(), action: 'review_pass', time: daysAgoIso(15), note: '清洁到位，复检合格' },
    ],
    createdAt: daysAgoIso(20),
    updatedAt: daysAgoIso(15),
  });

  return orders;
}
