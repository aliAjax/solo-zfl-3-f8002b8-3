export type MaterialType = 'wood' | 'metal' | 'stone' | 'plastic' | 'mixed';
export type OrientationType = 'east' | 'south' | 'west' | 'north' | 'southeast' | 'northeast' | 'southwest' | 'northwest';
export type ShadeLevelType = 'none' | 'partial' | 'full';
export type NoiseLevelType = 'quiet' | 'moderate' | 'noisy';
export type StayDurationType = 'short' | 'medium' | 'long' | 'verylong';
export type TimePeriodType = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface BenchExperience {
  id: string;
  benchId: string;
  timePeriod: TimePeriodType;
  notes: string;
  rating: number;
}

export interface Bench {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  material: MaterialType;
  orientation: OrientationType;
  hasBackrest: boolean;
  shadeLevel: ShadeLevelType;
  noiseLevel: NoiseLevelType;
  stayDuration: StayDurationType;
  rating: number;
  review: string;
  experiences: BenchExperience[];
  createdAt: string;
  updatedAt: string;
}

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  wood: '木质',
  metal: '金属',
  stone: '石质',
  plastic: '塑料',
  mixed: '混合材质',
};

export const ORIENTATION_LABELS: Record<OrientationType, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  southeast: '东南',
  northeast: '东北',
  southwest: '西南',
  northwest: '西北',
};

export const SHADE_LABELS: Record<ShadeLevelType, string> = {
  none: '无遮阴',
  partial: '部分遮阴',
  full: '完全遮阴',
};

export const NOISE_LABELS: Record<NoiseLevelType, string> = {
  quiet: '安静',
  moderate: '一般',
  noisy: '嘈杂',
};

export const STAY_DURATION_LABELS: Record<StayDurationType, string> = {
  short: '少于15分钟',
  medium: '15-30分钟',
  long: '30-60分钟',
  verylong: '1小时以上',
};

export const TIME_PERIOD_LABELS: Record<TimePeriodType, string> = {
  morning: '早晨',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜晚',
};

export const TIME_PERIOD_ICONS: Record<TimePeriodType, string> = {
  morning: 'sunrise',
  noon: 'sun',
  afternoon: 'cloud-sun',
  evening: 'sunset',
  night: 'moon',
};

// ---------- 养护工单 ----------

export type DefectCategoryType = 'structure' | 'surface' | 'parts' | 'hygiene' | 'safety' | 'other';
export type SeverityType = 'severe' | 'normal' | 'minor';
export type WorkOrderStatus = 'pending' | 'fixing' | 'review' | 'closed';
export type TimelineAction = 'create' | 'start' | 'submit' | 'review_pass' | 'review_reject';

export interface WorkOrderTimelineEntry {
  id: string;
  action: TimelineAction;
  time: string;
  operator?: string;
  note?: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  benchId: string;
  category: DefectCategoryType;
  severity: SeverityType;
  description: string;
  /** 发现日期，YYYY-MM-DD */
  foundDate: string;
  status: WorkOrderStatus;
  /** 整改人 */
  assignee?: string;
  /** 整改完成日期，YYYY-MM-DD */
  completedDate?: string;
  closedAt?: string;
  timeline: WorkOrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export const DEFECT_CATEGORY_LABELS: Record<DefectCategoryType, string> = {
  structure: '结构损坏',
  surface: '表面破损',
  parts: '部件缺失',
  hygiene: '卫生问题',
  safety: '安全隐患',
  other: '其他',
};

export const SEVERITY_LABELS: Record<SeverityType, string> = {
  severe: '严重',
  normal: '一般',
  minor: '轻微',
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending: '待整改',
  fixing: '整改中',
  review: '待复检',
  closed: '已关闭',
};

export const TIMELINE_ACTION_LABELS: Record<TimelineAction, string> = {
  create: '开单',
  start: '开始整改',
  submit: '提交整改',
  review_pass: '复检通过',
  review_reject: '复检不通过',
};
