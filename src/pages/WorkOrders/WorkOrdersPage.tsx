import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarClock, ClipboardList, MapPin, Plus } from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import { useInitWorkOrders, useWorkOrderStore } from '@/store/useWorkOrderStore';
import { DEFECT_CATEGORY_LABELS, SEVERITY_LABELS } from '@/types';
import type { SeverityType, WorkOrderStatus } from '@/types';
import {
  SEVERITY_DEADLINE_DAYS,
  formatDateCn,
  getDeadlineStr,
  getOverdueDays,
  getRemainingDays,
  isOrderOverdue,
} from '@/utils/workOrder';
import { OverdueBadge, SeverityBadge, StatusBadge } from '@/components/WorkOrder/WorkOrderBadges';

const STATUS_TABS: { value: WorkOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待整改' },
  { value: 'fixing', label: '整改中' },
  { value: 'review', label: '待复检' },
  { value: 'closed', label: '已关闭' },
];

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  useInitWorkOrders();
  const orders = useWorkOrderStore((s) => s.orders);
  const benches = useBenchStore((s) => s.benches);

  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityType | 'all'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const benchMap = useMemo(() => new Map(benches.map((b) => [b.id, b])), [benches]);

  const stats = useMemo(() => {
    return {
      pending: orders.filter((o) => o.status === 'pending').length,
      fixing: orders.filter((o) => o.status === 'fixing').length,
      review: orders.filter((o) => o.status === 'review').length,
      overdue: orders.filter((o) => isOrderOverdue(o)).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (severityFilter !== 'all' && o.severity !== severityFilter) return false;
      if (overdueOnly && !isOrderOverdue(o)) return false;
      return true;
    });
    // 未结的排前面（逾期的更靠前），已关闭的排最后；同组按发现日期倒序
    return [...list].sort((a, b) => {
      const aClosed = a.status === 'closed' ? 1 : 0;
      const bClosed = b.status === 'closed' ? 1 : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;
      const aOverdue = isOrderOverdue(a) ? 1 : 0;
      const bOverdue = isOrderOverdue(b) ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      return b.foundDate.localeCompare(a.foundDate);
    });
  }, [orders, statusFilter, severityFilter, overdueOnly]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-deep-brown mb-1">
            养护工单
          </h2>
          <p className="text-ink-light text-sm">
            巡查发现缺陷及时开单，跟踪整改与复检全过程
          </p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-ochre text-white rounded-lg font-medium text-sm hover:bg-ochre-light transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          开单
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="paper-texture rounded-xl shadow-paper p-3 text-center">
          <div className="text-xl font-bold font-serif text-ochre">{stats.pending}</div>
          <div className="text-xs text-ink-light">待整改</div>
        </div>
        <div className="paper-texture rounded-xl shadow-paper p-3 text-center">
          <div className="text-xl font-bold font-serif text-sky-700">{stats.fixing}</div>
          <div className="text-xs text-ink-light">整改中</div>
        </div>
        <div className="paper-texture rounded-xl shadow-paper p-3 text-center">
          <div className="text-xl font-bold font-serif text-violet-700">{stats.review}</div>
          <div className="text-xs text-ink-light">待复检</div>
        </div>
        <div className="paper-texture rounded-xl shadow-paper p-3 text-center">
          <div className={`text-xl font-bold font-serif ${stats.overdue > 0 ? 'text-red-500' : 'text-ink-light'}`}>
            {stats.overdue}
          </div>
          <div className="text-xs text-ink-light">已逾期</div>
        </div>
      </div>

      <div className="paper-texture rounded-xl shadow-paper p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-moss-green text-white shadow-sm'
                    : 'text-ink-light hover:bg-deep-brown/5 hover:text-deep-brown'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityType | 'all')}
            className="px-3 py-1.5 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white cursor-pointer"
          >
            <option value="all">全部严重程度</option>
            {(Object.keys(SEVERITY_LABELS) as SeverityType[]).map((value) => (
              <option key={value} value={value}>
                {SEVERITY_LABELS[value]}（{SEVERITY_DEADLINE_DAYS[value]}天）
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-ink-light cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="accent-red-500"
            />
            仅看逾期
          </label>

          <span className="text-sm text-ink-light ml-auto">
            共 <span className="font-medium text-deep-brown">{filteredOrders.length}</span> 条工单
          </span>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => {
            const bench = benchMap.get(order.benchId);
            const overdue = isOrderOverdue(order);
            const overdueDays = getOverdueDays(order);
            const remaining = getRemainingDays(order);
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className={`paper-texture rounded-xl shadow-paper p-4 cursor-pointer card-hover fade-in opacity-0 stagger-${Math.min(index + 1, 6)} ${
                  overdue ? 'border border-red-300/60' : 'border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs text-ink-light">{order.orderNo}</span>
                      <StatusBadge status={order.status} />
                      <SeverityBadge severity={order.severity} />
                      {overdue && <OverdueBadge days={overdueDays} />}
                    </div>

                    <h3 className="font-serif font-semibold text-deep-brown truncate mb-1">
                      {bench?.name ?? '长椅已删除'}
                    </h3>

                    {bench && (
                      <div className="flex items-center gap-1 text-ink-light text-sm mb-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{bench.location}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-light">
                      <span>缺陷类别：{DEFECT_CATEGORY_LABELS[order.category]}</span>
                      <span>发现日期：{formatDateCn(order.foundDate)}</span>
                      <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                        {overdue ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <CalendarClock className="w-3.5 h-3.5" />
                        )}
                        整改期限：{formatDateCn(getDeadlineStr(order))}
                        {order.status !== 'closed' && !overdue && remaining >= 0 && (
                          <span className="text-ink-light">（剩余 {remaining} 天）</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="paper-texture rounded-xl shadow-paper p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-moss-green/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-moss-green/50" />
          </div>
          <h3 className="font-serif text-lg font-medium text-deep-brown mb-2">
            {orders.length === 0 ? '还没有养护工单' : '没有符合条件的工单'}
          </h3>
          <p className="text-ink-light text-sm">
            {orders.length === 0
              ? '巡查发现长椅缺陷时，点击右上角「开单」记录'
              : '试试调整筛选条件'}
          </p>
        </div>
      )}
    </div>
  );
}
