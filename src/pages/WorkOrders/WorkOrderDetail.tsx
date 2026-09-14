import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Lock,
  MapPin,
  Play,
  RotateCcw,
  Send,
  User,
} from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import { useInitWorkOrders, useWorkOrderStore } from '@/store/useWorkOrderStore';
import {
  DEFECT_CATEGORY_LABELS,
  SEVERITY_LABELS,
  TIMELINE_ACTION_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from '@/types';
import type { WorkOrderStatus } from '@/types';
import {
  SEVERITY_DEADLINE_DAYS,
  formatDateCn,
  getDeadlineStr,
  getOverdueDays,
  getRemainingDays,
  isOrderOverdue,
  todayStr,
} from '@/utils/workOrder';
import { OverdueBadge, SeverityBadge, StatusBadge } from '@/components/WorkOrder/WorkOrderBadges';

const FLOW_STEPS: WorkOrderStatus[] = ['pending', 'fixing', 'review', 'closed'];

/** 各状态下被拦截的操作及原因（在界面上明示） */
const BLOCKED_HINTS: Record<WorkOrderStatus, string[]> = {
  pending: ['提交整改：需先开始整改，不能跳步', '复检：整改尚未提交，不能跳步'],
  fixing: ['开始整改：工单已在整改中', '复检：需先提交整改，不能跳步'],
  review: ['开始整改：不能回退（仅复检不通过时才会退回整改中）', '提交整改：已提交，等待复检'],
  closed: ['工单已关闭，所有操作已锁定'],
};

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useInitWorkOrders();

  const initialized = useWorkOrderStore((s) => s.initialized);
  const order = useWorkOrderStore((s) => s.orders.find((o) => o.id === id));
  const bench = useBenchStore((s) =>
    order ? s.benches.find((b) => b.id === order.benchId) : undefined
  );

  const [assignee, setAssignee] = useState('');
  const [completedDate, setCompletedDate] = useState(todayStr());
  const [reviewNote, setReviewNote] = useState('');
  const [error, setError] = useState('');

  if (!initialized) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-ink-light">加载中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="paper-texture rounded-xl shadow-paper p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-moss-green/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-moss-green/50" />
          </div>
          <h3 className="font-serif text-lg font-medium text-deep-brown mb-2">工单不存在</h3>
          <p className="text-ink-light text-sm mb-6">该工单可能已被删除</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors"
          >
            返回工单列表
          </button>
        </div>
      </div>
    );
  }

  const overdue = isOrderOverdue(order);
  const overdueDays = getOverdueDays(order);
  const remaining = getRemainingDays(order);
  const deadline = getDeadlineStr(order);
  const currentStepIndex = FLOW_STEPS.indexOf(order.status);

  const runAction = (action: () => { ok: boolean; message?: string }, after?: () => void) => {
    const result = action();
    if (result.ok) {
      setError('');
      after?.();
    } else {
      setError(result.message || '操作失败');
    }
  };

  const handleStart = () =>
    runAction(() => useWorkOrderStore.getState().startFixing(order.id));

  const handleSubmitRectification = () =>
    runAction(
      () => useWorkOrderStore.getState().submitRectification(order.id, assignee, completedDate),
      () => setAssignee('')
    );

  const handleReview = (passed: boolean) =>
    runAction(
      () => useWorkOrderStore.getState().reviewOrder(order.id, passed, reviewNote),
      () => setReviewNote('')
    );

  const sortedTimeline = [...order.timeline].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-ink-light hover:text-deep-brown mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回</span>
      </button>

      {overdue && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-600 fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>
            该工单已逾期 {overdueDays} 天（{SEVERITY_LABELS[order.severity]}缺陷应于发现后{' '}
            {SEVERITY_DEADLINE_DAYS[order.severity]} 天内完成整改），请尽快处理。
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-1">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="font-mono text-sm text-ink-light">{order.orderNo}</span>
              <StatusBadge status={order.status} />
              <SeverityBadge severity={order.severity} />
              {overdue && <OverdueBadge days={overdueDays} />}
            </div>

            {/* 流转步骤条 */}
            <div className="flex items-center mb-6">
              {FLOW_STEPS.map((step, index) => {
                const reached = index <= currentStepIndex;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          index === currentStepIndex
                            ? 'bg-ochre text-white ring-4 ring-ochre/20'
                            : reached
                              ? 'bg-moss-green text-white'
                              : 'bg-warm-beige text-ink-light'
                        }`}
                      >
                        {reached && index !== currentStepIndex ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1.5 whitespace-nowrap ${
                          index === currentStepIndex
                            ? 'text-ochre font-semibold'
                            : reached
                              ? 'text-moss-green'
                              : 'text-ink-light'
                        }`}
                      >
                        {WORK_ORDER_STATUS_LABELS[step]}
                      </span>
                    </div>
                    {index < FLOW_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 mb-5 rounded ${
                          index < currentStepIndex ? 'bg-moss-green' : 'bg-warm-beige'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">长椅</span>
                {bench ? (
                  <button
                    onClick={() => navigate(`/bench/${bench.id}`)}
                    className="text-moss-green hover:underline font-medium text-left"
                  >
                    {bench.name}
                  </button>
                ) : (
                  <span className="text-ink-light">长椅已删除</span>
                )}
              </div>
              {bench && (
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-ink-light">位置</span>
                  <span className="text-deep-brown inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-ink-light" />
                    {bench.location}
                  </span>
                </div>
              )}
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">缺陷类别</span>
                <span className="text-deep-brown">{DEFECT_CATEGORY_LABELS[order.category]}</span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">严重程度</span>
                <span className="text-deep-brown">
                  {SEVERITY_LABELS[order.severity]}（{SEVERITY_DEADLINE_DAYS[order.severity]} 天内整改）
                </span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">发现日期</span>
                <span className="text-deep-brown">{formatDateCn(order.foundDate)}</span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">整改期限</span>
                <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-deep-brown'}`}>
                  <CalendarClock className="w-3.5 h-3.5" />
                  {formatDateCn(deadline)}
                  {order.status !== 'closed' && !overdue && remaining >= 0 && (
                    <span className="text-ink-light">（剩余 {remaining} 天）</span>
                  )}
                  {overdue && <span>（已逾期 {overdueDays} 天）</span>}
                </span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">整改人</span>
                <span className="text-deep-brown">{order.assignee || '—'}</span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-ink-light">完成日期</span>
                <span className="text-deep-brown">
                  {order.completedDate ? formatDateCn(order.completedDate) : '—'}
                </span>
              </div>
              {order.closedAt && (
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-ink-light">关闭时间</span>
                  <span className="text-deep-brown">
                    {new Date(order.closedAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
            </div>

            {order.description && (
              <div className="mt-5 pt-4 border-t border-deep-brown/10">
                <h3 className="font-serif text-sm font-semibold text-deep-brown mb-1.5">缺陷描述</h3>
                <p className="text-sm text-ink-light leading-relaxed">{order.description}</p>
              </div>
            )}
          </div>

          {/* 操作面板 */}
          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-2">
            <h3 className="font-serif text-lg font-semibold text-deep-brown mb-4">整改操作</h3>

            {order.status === 'pending' && (
              <div>
                <p className="text-sm text-ink-light mb-4">
                  工单已开立，请安排人员开始整改。
                </p>
                <button
                  onClick={handleStart}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-white bg-ochre hover:bg-ochre-light rounded-lg transition-colors shadow-md"
                >
                  <Play className="w-4 h-4" />
                  开始整改
                </button>
              </div>
            )}

            {order.status === 'fixing' && (
              <div>
                <p className="text-sm text-ink-light mb-4">
                  整改完成后，填写整改人和完成日期提交，进入待复检。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-ink-light mb-1">
                      整改人 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                      <input
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        placeholder="填写整改人姓名"
                        className="w-full pl-9 pr-3 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-sm text-deep-brown placeholder:text-ink-light/60 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-light mb-1">
                      完成日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={completedDate}
                      min={order.foundDate}
                      max={todayStr()}
                      onChange={(e) => setCompletedDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-sm text-deep-brown focus:bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-ink-light mb-4">
                  完成日期不能早于发现日期（{formatDateCn(order.foundDate)}），也不能晚于今天。
                </p>
                <button
                  onClick={handleSubmitRectification}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                  提交整改
                </button>
              </div>
            )}

            {order.status === 'review' && (
              <div>
                <p className="text-sm text-ink-light mb-4">
                  {order.assignee} 已于 {order.completedDate ? formatDateCn(order.completedDate) : '—'} 完成整改，请复检。
                  复检通过即结单；不通过将退回整改中。
                </p>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  placeholder="复检意见（选填，不通过时建议填写原因）"
                  className="w-full px-3 py-2.5 mb-4 bg-white/50 border border-deep-brown/10 rounded-lg text-sm text-deep-brown placeholder:text-ink-light/60 focus:bg-white resize-none"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleReview(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    复检通过
                  </button>
                  <button
                    onClick={() => handleReview(false)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    复检不通过
                  </button>
                </div>
              </div>
            )}

            {order.status === 'closed' && (
              <div className="flex items-center gap-3 p-4 bg-moss-green/5 border border-moss-green/20 rounded-lg text-sm text-moss-green">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>
                  工单已复检通过并关闭
                  {order.closedAt ? `（${new Date(order.closedAt).toLocaleString('zh-CN')}）` : ''}
                  ，不能再进行任何操作。
                </span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {BLOCKED_HINTS[order.status].length > 0 && (
              <div className="mt-5 pt-4 border-t border-deep-brown/10">
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-light mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  当前不可执行的操作
                </div>
                <ul className="space-y-1">
                  {BLOCKED_HINTS[order.status].map((hint) => (
                    <li key={hint} className="text-xs text-ink-light/80 flex items-start gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-ink-light/50 flex-shrink-0" />
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 时间线 */}
        <div className="space-y-6">
          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-3">
            <h3 className="font-serif text-lg font-semibold text-deep-brown mb-4">流转记录</h3>
            <div className="relative pl-5">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-deep-brown/10" />
              <div className="space-y-4">
                {sortedTimeline.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div
                      className={`absolute -left-5 top-1.5 w-[11px] h-[11px] rounded-full border-2 ${
                        entry.action === 'review_reject'
                          ? 'bg-red-100 border-red-400'
                          : entry.action === 'review_pass'
                            ? 'bg-moss-green/20 border-moss-green'
                            : 'bg-paper border-ochre'
                      }`}
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-sm font-medium ${
                          entry.action === 'review_reject' ? 'text-red-500' : 'text-deep-brown'
                        }`}
                      >
                        {TIMELINE_ACTION_LABELS[entry.action]}
                      </span>
                      {entry.action === 'review_reject' && (
                        <span className="text-xs text-red-400">退回整改中</span>
                      )}
                      {entry.action === 'review_pass' && (
                        <span className="text-xs text-moss-green">工单关闭</span>
                      )}
                    </div>
                    <div className="text-xs text-ink-light mt-0.5">
                      {new Date(entry.time).toLocaleString('zh-CN')}
                      {entry.operator && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <User className="w-3 h-3" />
                          {entry.operator}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <div className="text-xs text-ink-light/80 mt-1 bg-warm-cream/60 rounded px-2 py-1">
                        {entry.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-4">
            <h3 className="font-serif text-sm font-semibold text-deep-brown mb-3">流转规则</h3>
            <div className="flex items-center gap-1 flex-wrap text-xs text-ink-light">
              {FLOW_STEPS.map((step, index) => (
                <span key={step} className="inline-flex items-center gap-1">
                  <span className={order.status === step ? 'text-ochre font-semibold' : ''}>
                    {WORK_ORDER_STATUS_LABELS[step]}
                  </span>
                  {index < FLOW_STEPS.length - 1 && <ArrowRight className="w-3 h-3" />}
                </span>
              ))}
            </div>
            <p className="text-xs text-ink-light/80 mt-2 leading-relaxed">
              只能按顺序流转，不能跳步或回退；复检不通过会退回整改中重新整改。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
