import tutorialCatalog from './tutorial-catalog.json';
import productCatalog from './product-catalog.json';
import type {
  ArchiveDetailData,
  ArchiveSummary,
  HairColor,
  MockVideo,
  OtherProduct,
  PrimaryProduct,
  RouteType,
  TutorialStep,
} from './types';

interface TargetMeta {
  color: HairColor;
  alias: string;
  accent: string;
  filter: string;
  riskName: string;
}

export const TARGET_META: Record<string, TargetMeta> = {
  red: {
    alias: '海王红',
    accent: '#b95852',
    filter: 'hue-rotate(108deg) saturate(1.28) brightness(.92)',
    riskName: '偏橘红',
    color: {
      tone: 'red',
      level: 6,
      saturation: 'medium',
      display_name: '海王红',
      rgb: { r: 159, g: 55, b: 57 },
      hsv: { h: 359, s: 65, v: 62 },
      lab: { l: 38, a: 43, b: 22 },
      confidence: 0.94,
    },
  },
  orange: {
    alias: '元气橘',
    accent: '#d7854f',
    filter: 'hue-rotate(153deg) saturate(1.22) brightness(1.02)',
    riskName: '偏黄橘',
    color: {
      tone: 'orange',
      level: 8,
      saturation: 'medium',
      display_name: '元气橘',
      rgb: { r: 215, g: 118, b: 56 },
      hsv: { h: 23, s: 74, v: 84 },
      lab: { l: 61, a: 34, b: 49 },
      confidence: 0.91,
    },
  },
  blue: {
    alias: '海盐蓝',
    accent: '#5887a2',
    filter: 'hue-rotate(-35deg) saturate(1.12) contrast(1.03)',
    riskName: '偏青绿',
    color: {
      tone: 'blue',
      level: 8,
      saturation: 'medium',
      display_name: '海盐蓝',
      rgb: { r: 74, g: 113, b: 148 },
      hsv: { h: 208, s: 50, v: 58 },
      lab: { l: 46, a: -3, b: -24 },
      confidence: 0.93,
    },
  },
  purple: {
    alias: '葡萄紫',
    accent: '#79688d',
    filter: 'hue-rotate(36deg) saturate(1.18) brightness(.94)',
    riskName: '偏莓红',
    color: {
      tone: 'purple',
      level: 7,
      saturation: 'medium',
      display_name: '葡萄紫',
      rgb: { r: 111, g: 79, b: 127 },
      hsv: { h: 280, s: 38, v: 50 },
      lab: { l: 38, a: 23, b: -21 },
      confidence: 0.92,
    },
  },
  green: {
    alias: '苔藓绿',
    accent: '#66836d',
    filter: 'hue-rotate(-76deg) saturate(.88) brightness(.9)',
    riskName: '偏黄绿',
    color: {
      tone: 'green',
      level: 7,
      saturation: 'light',
      display_name: '苔藓绿',
      rgb: { r: 83, g: 116, b: 88 },
      hsv: { h: 129, s: 28, v: 45 },
      lab: { l: 45, a: -18, b: 12 },
      confidence: 0.9,
    },
  },
  brown: {
    alias: '榛果灰棕',
    accent: '#856b5c',
    filter: 'sepia(.38) saturate(.68) brightness(.82) contrast(1.08)',
    riskName: '偏暖棕',
    color: {
      tone: 'ash_brown',
      level: 6,
      saturation: 'light',
      display_name: '榛果灰棕',
      rgb: { r: 112, g: 89, b: 78 },
      hsv: { h: 19, s: 30, v: 44 },
      lab: { l: 39, a: 8, b: 10 },
      confidence: 0.95,
    },
  },
};

// 独立目标色，避免粉色借用紫色、冷茶借用灰棕的方案与商品。
TARGET_META.pink = { alias: '灰粉色', accent: '#ba8299', filter: 'none', riskName: '偏暖粉', color: { tone: 'pink', level: 8, saturation: 'light', display_name: '灰粉色', rgb: { r: 186, g: 130, b: 153 } } };
TARGET_META.tea = { alias: '冷茶棕', accent: '#65554c', filter: 'none', riskName: '偏暖棕', color: { tone: 'cool_brown', level: 5, saturation: 'light', display_name: '冷茶棕', rgb: { r: 101, g: 85, b: 76 } } };

const presetVideos = [
  ['purple_tutorial', '紫色固色教程', 'purple', 'purple-tutorial.mp4', 'purple.jpg'],
  ['purple_transition', '葡萄紫颜值转场', 'purple', 'purple-transition.mp4', 'purple.jpg'],
  ['brown_tutorial', '冷棕长发染发教程', 'brown', 'cool-brown-tutorial.mp4', 'cool-brown.jpg'],
  ['pink_tutorial', '灰粉色固色教程', 'pink', 'pink-tutorial.mp4', 'pink.jpg'],
  ['tea_tutorial', '冷茶短发染发教程', 'tea', 'cool-tea-tutorial.mp4', 'cool-tea.jpg'],
  ['red_tutorial', '海王红染发教程', 'red', 'red-tutorial.mp4', 'red.jpg'],
  ['red_transition', '海王红颜值转场', 'red', 'red-transition.mp4', 'red.jpg'],
  ['blue_tutorial', '海盐蓝染发教程', 'blue', 'blue-tutorial.mp4', 'blue.jpg'],
  ['blue_transition', '海盐蓝颜值转场', 'blue', 'blue-transition.mp4', 'blue.jpg'],
] as const;

export const MOCK_VIDEOS: MockVideo[] = presetVideos.map(
  ([id, title, tone, video, cover]) => {
    const meta = TARGET_META[tone];
    const folder = id.startsWith('pink_') ? 'pink' : id.startsWith('tea_') ? 'cold_tea' : tone === 'brown' ? 'cold_brown' : tone;
    return {
      video_id: `vid_${tone}_${id}`,
      title,
      video_type: 'dye_related',
      url: `/mock-assets/${folder}/${id.includes('transition') ? 'transition' : 'tutorial'}.mp4`,
      cover_url: `/mock-assets/${folder}/after.jpg`,
      target_frame_url: `/mock-assets/${folder}/after.jpg`,
      trigger_time_ms: 2200,
      color_name:
        id === 'pink_tutorial' ? '灰粉色' : id === 'tea_tutorial' ? '冷茶棕' : meta.color.display_name,
      color_alias:
        id === 'pink_tutorial' ? '灰粉色' : id === 'tea_tutorial' ? '冷茶棕' : meta.alias,
      accent: meta.accent,
      bound_product_id: `prod_${tone}_same`,
      bound_tutorial_video_id: id.includes('tutorial') ? id : undefined,
    };
  },
);

// 首页每个发色只保留教程主视频；完整素材列表用于兼容已保存档案。
export const DISCOVERY_VIDEOS = MOCK_VIDEOS
  .filter(video => Boolean(video.bound_tutorial_video_id))
  .sort((a, b) => {
    const priority = (id: string) => id.includes('red_tutorial') ? 0 : id.includes('blue_tutorial') ? 1 : 2;
    return priority(a.video_id) - priority(b.video_id);
  });

export const EDITABLE_OPTIONS = {
  hair_length: [
    { value: 'ear', label: '齐耳短发' },
    { value: 'shoulder', label: '齐肩发' },
    { value: 'chest', label: '齐胸中长发' },
    { value: 'waist', label: '齐腰长发' },
    { value: 'below_waist', label: '腰部以下超长发' },
  ],
  hair_volume: [
    { value: 'low', label: '少' },
    { value: 'medium', label: '适中' },
    { value: 'high', label: '多' },
  ],
  dye_history: [
    { value: 'natural', label: '无漂染史的自然发' },
    { value: 'dyed_no_bleach', label: '染过未漂过' },
    { value: 'bleached_1_2', label: '漂过 1–2 次' },
    { value: 'bleached_3_plus', label: '漂过 3 次以上' },
    { value: 'dyed_black', label: '染过黑色' },
    { value: 'unknown', label: '不确定' },
  ],
};

export const CURRENT_GOLD: HairColor = {
  tone: 'yellow',
  level: 8,
  saturation: 'medium',
  display_name: '8 度暖金',
  rgb: { r: 205, g: 166, b: 96 },
  hsv: { h: 39, s: 53, v: 80 },
  lab: { l: 70, a: 7, b: 42 },
  confidence: 0.76,
};

export const CURRENT_COLOR_OPTIONS: HairColor[] = [
  {
    tone: 'yellow',
    level: 8,
    saturation: 'medium',
    display_name: '8 度暖金',
  },
  {
    tone: 'yellow_orange',
    level: 7,
    saturation: 'medium',
    display_name: '7 度橘金',
  },
  {
    tone: 'yellow',
    level: 9,
    saturation: 'light',
    display_name: '9 度浅金',
  },
];

export function productsForRoute(route: RouteType, target: HairColor) {
  const familyByTone: Record<string, string[]> = {
    red: ['red'], orange: ['orange'], blue: ['blue'], purple: ['purple'],
    pink: ['pink'], green: ['green'], ash_brown: ['gray_brown', 'brown'],
    cool_brown: ['brown', 'gray_brown'], brown: ['brown'], gray: ['gray'],
  };
  const families = familyByTone[target.tone] ?? [];
  const seen = new Set<string>();
  return productCatalog
    .filter(item => families.includes(item.family) && (route === 'dye' ? item.type.startsWith('hair_dye_') : item.type.startsWith('color_deposit_')))
    .sort((a, b) => families.indexOf(a.family) - families.indexOf(b.family) || a.price_max - b.price_max)
    .filter(item => { if (seen.has(item.source_id)) return false; seen.add(item.source_id); return true; })
    .map(item => {
      const priceText = item.price_min === item.price_max ? `¥${item.price_max}` : `¥${item.price_min}–${item.price_max}`;
      const date = item.captured_at.slice(0, 10);
      const primary: PrimaryProduct = {
        sku_id: item.id, brand: item.brand, product_name: item.name,
        shade_name: item.shade, product_type: route, badge: '知识库商品',
        is_video_same_product: false, url: item.image,
        suitable_reason: `按${target.display_name}召回同色系「${item.shade}」。知识库历史价 ${priceText}（${date}）；不代表实时售价。`,
        possible_risk: item.price_min !== item.price_max ? '价格与具体规格尚未一一对应；预算按区间上限估算，实际规格和显色需确认。' : '同色系不等于相同染后效果，实际规格与显色需确认。',
        usage: { units_needed: 1, units_label: '1 份预算演示，实际用量待确认', method: '查看该商品原始使用说明', waiting_minutes: 0,
          short_instruction: '按商品包装及原始说明操作，演示不推断统一停留时间。', image_urls: item.usage_images },
        price: { unit_price: item.price_max, total_price: item.price_max, currency: 'CNY', collected_at: date },
        purchase_url: item.source_url, purchase_mode: 'mock',
        duration: '以实际商品说明为准',
        official_base_effect: item.levels.length ? `知识库色卡展示底色：${item.levels.join('、')} 度；不代表所有底色均适用。` : '知识库未记录完整底色范围',
      };
      const other: OtherProduct = {
        sku_id: primary.sku_id, brand: primary.brand, product_name: primary.product_name,
        shade_name: primary.shade_name, product_type: route, is_video_same_product: false,
        url: primary.url, card_reason: primary.suitable_reason, possible_risk: primary.possible_risk,
        units_needed: 1, units_label: primary.usage.units_label,
        unit_price: item.price_max, total_price: item.price_max, currency: 'CNY',
        purchase_url: primary.purchase_url, purchase_mode: 'mock', duration: primary.duration,
        official_base_effect: primary.official_base_effect,
      };
      return { primary, other, swatch: TARGET_META[Object.keys(TARGET_META).find(key => TARGET_META[key].color.tone === target.tone) ?? 'blue'].accent };
    });
}

function tutorialStep(
  tutorialId: string,
  stepNo: number,
  totalSteps: number,
  startTimeMs: number,
  endTimeMs: number,
  title: string,
  description: string,
  points: string[],
  caution?: string,
): TutorialStep {
  return {
    step_id: `${tutorialId}_step_${String(stepNo).padStart(2, '0')}`,
    step_no: stepNo,
    total_steps: totalSteps,
    start_time_ms: startTimeMs,
    end_time_ms: endTimeMs,
    title,
    description,
    points,
    caution,
    display_time_range: `${Math.floor(startTimeMs / 60000)}:${String(
      Math.floor((startTimeMs % 60000) / 1000),
    ).padStart(2, '0')}-${Math.floor(endTimeMs / 60000)}:${String(
      Math.floor((endTimeMs % 60000) / 1000),
    ).padStart(2, '0')}`,
    source: 'sensevoice_auto_segment',
  };
}

export const TUTORIAL_STEPS_BY_VIDEO_ID: Record<string, TutorialStep[]> = tutorialCatalog;

export const TUTORIAL_STEPS: TutorialStep[] = TUTORIAL_STEPS_BY_VIDEO_ID.tutorial_blue;

export const EMPTY_ARCHIVE_DETAIL: ArchiveDetailData = {
  archive_id: '',
  created_at: '',
  purchase_status: 'saved',
  entry_video_id: '',
  profile_snapshot: {
    current_hair: { region_mode: 'single', color: CURRENT_GOLD },
    target_color: TARGET_META.blue.color,
    hair_length: 'chest',
    hair_volume: 'medium',
    dye_history: 'dyed_no_bleach',
  },
  plan_snapshot: {
    plan_id: '',
    feasibility: 'conditional',
    summary: '',
    reachability_score: 0,
    selected_route: 'dye',
    selected_preview_level: 3,
    default_preview_level: 3,
    risks: [],
  },
  product_snapshot: {
    ...productsForRoute('dye', TARGET_META.blue.color)[0].primary,
    recommendation_id: '',
  },
  tutorial_video_id: 'tutorial_001',
  tutorial_available: true,
  after_video_url: null,
};

export function toArchiveSummary(detail: ArchiveDetailData): ArchiveSummary {
  const currentColor =
    detail.profile_snapshot.current_hair.color?.display_name ??
    detail.profile_snapshot.current_hair.regions?.end.color.display_name ??
    '待确认';
  return {
    archive_id: detail.archive_id,
    target_color_name: detail.profile_snapshot.target_color.display_name,
    target_image_url: detail.selected_preview_image_url ?? undefined,
    current_color_name: currentColor,
    product_name: `${detail.product_snapshot.brand}${detail.product_snapshot.product_name}`,
    shade_name: detail.product_snapshot.shade_name,
    purchase_status: detail.purchase_status,
    created_at: detail.created_at,
    tutorial_available: detail.tutorial_available,
    status: detail.completion_record
      ? 'completed'
      : detail.purchase_status === 'saved'
        ? 'saved'
        : 'ready',
  };
}
