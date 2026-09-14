import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ClipboardList } from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import { useInitWorkOrders, useWorkOrderStore } from '@/store/useWorkOrderStore';
import { DEFECT_CATEGORY_LABELS, SEVERITY_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types';
import type { DefectCategoryType, SeverityType } from '@/types';
import { SEVERITY_DEADLINE_DAYS, todayStr } from '@/utils/workOrder';

export default function WorkOrderNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useInitWorkOrders();

  const benches = useBenchStore((s) => s.benches);
  const orders = useWorkOrderStore((s) => s.orders);
  const createOrder = useWorkOrderStore((s) => s.createOrder);

  const [benchId, setBenchId] = useState(searchParams.get('benchId') || '');
  const [category, setCategory] = useState<DefectCategoryType>('structure');
  const [severity, setSeverity] = useState<SeverityType>('normal');
  const [foundDate, setFoundDate] = useState(todayStr());
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const sortedBenches = useMemo(
    () => [...benches].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    [benches]
  );

  const openOrder = useMemo(
    () => orders.find((o) => o.benchId === benchId && o.status !== 'closed'),
    [orders, benchId]
  );

  const handleSubmit = () => {
    if (!benchId) {
      setError('请选择长椅');
      return;
    }
    const result = createOrder({ benchId, category, severity, description, foundDate });
    if (result.ok === false) {
      setError(result.message);
      return;
    }
    navigate(`/orders/${result.order.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-ink-light hover:text-deep-brown mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回</span>
      </button>

      <div className="paper-texture rounded-xl shadow-paper p-6 fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ochre/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-ochre" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-deep-brown">开养护工单</h2>
            <p className="text-xs text-ink-light">记录巡查发现的缺陷，进入整改流程</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1.5">
              长椅 <span className="text-red-500">*</span>
            </label>
            <select
              value={benchId}
              onChange={(e) => {
                setBenchId(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white cursor-pointer"
            >
              <option value="">请选择长椅</option>
              {sortedBenches.map((bench) => (
                <option key={bench.id} value={bench.id}>
                  {bench.name}（{bench.location}）
                </option>
              ))}
            </select>
            {openOrder && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  该长椅已有未结工单{' '}
                  <button
                    onClick={() => navigate(`/orders/${openOrder.id}`)}
                    className="font-semibold underline hover:text-amber-800"
                  >
                    {openOrder.orderNo}
                  </button>
                  （{WORK_ORDER_STATUS_LABELS[openOrder.status]}），不能重复开单，请先处理完毕。
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1.5">
              缺陷类别 <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DefectCategoryType)}
              className="w-full px-3 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white cursor-pointer"
            >
              {(Object.keys(DEFECT_CATEGORY_LABELS) as DefectCategoryType[]).map((value) => (
                <option key={value} value={value}>
                  {DEFECT_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1.5">
              严重程度 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(SEVERITY_LABELS) as SeverityType[]).map((value) => {
                const selected = severity === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSeverity(value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selected
                        ? value === 'severe'
                          ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
                          : value === 'normal'
                            ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                            : 'border-moss-green bg-moss-green/5 ring-2 ring-moss-green/20'
                        : 'border-deep-brown/10 bg-white/50 hover:border-deep-brown/30'
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        value === 'severe'
                          ? 'text-red-600'
                          : value === 'normal'
                            ? 'text-amber-700'
                            : 'text-moss-green'
                      }`}
                    >
                      {SEVERITY_LABELS[value]}
                    </div>
                    <div className="text-xs text-ink-light mt-0.5">
                      {SEVERITY_DEADLINE_DAYS[value]} 天内整改
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1.5">
              发现日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={foundDate}
              max={todayStr()}
              onChange={(e) => setFoundDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white"
            />
            <p className="text-xs text-ink-light mt-1">
              整改期限自发现日期起算：严重 3 天、一般 7 天、轻微 15 天
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-brown mb-1.5">缺陷描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="补充描述缺陷的位置、程度等（选填）"
              className="w-full px-3 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2.5 text-sm text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!!openOrder}
              className={`flex-1 px-4 py-2.5 text-sm text-white rounded-lg transition-colors shadow-md ${
                openOrder
                  ? 'bg-ink-light/40 cursor-not-allowed'
                  : 'bg-ochre hover:bg-ochre-light hover:shadow-lg'
              }`}
            >
              确认开单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
