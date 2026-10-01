import { DISCOVERY_VIDEOS } from './mock-data';
import matrixData from './color-matrix';
import { CURRENT_COLOR_OPTIONS, CURRENT_GOLD, EDITABLE_OPTIONS, MOCK_VIDEOS, TARGET_META, TUTORIAL_STEPS, TUTORIAL_STEPS_BY_VIDEO_ID, productsForRoute, toArchiveSummary, } from './mock-data';
import type { AfterPhotoData, AfterVideoTaskData,   ArchiveCreateData, ArchiveDetailData, ArchiveListData, Budget, CompletionRecord, FlowDraft, HairColor, HairProfileConfirmationData, HairProfileData, HairProfileUpdate, MediaImageData, MockVideosData, PlanResultData, PreviewImage, PreviewTaskData, ProductRecommendationData, PurchaseStatus, RouteType, TutorialAction, TutorialSessionData, } from './types';
import type { ColorMatrix } from './hair-mirror-core';
const DRAFT_STORAGE = 'tony:flow-draft:v2';
const ARCHIVE_STORAGE = 'tony:archives:v2';
const SESSION_STORAGE = 'tony:tutorial-sessions:v2';
const IMAGE_STORAGE = 'tony:images:v1';
export class ApiError extends Error {
    code: number;
    traceId?: string;
    constructor(message: string, code = -1, traceId?: string) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.traceId = traceId;
    }
}
function qaSummaryStatement(text: string) {
    let raw = text.trim().replace(/\s+/g, ' ');
    if (!raw)
        return '';
    if (raw.includes('：'))
        raw = raw.split('：').slice(1).join('：').trim();
    else if (raw.includes(':'))
        raw = raw.split(':').slice(1).join(':').trim();
    for (const prefix of ['好的，', '好的。', '嗯，', '嗯。', '哦，', '哦。', '根据染膏说明书，']) {
        if (raw.startsWith(prefix))
            raw = raw.slice(prefix.length).trim();
    }
    raw = raw.replaceAll('哦', '').trim();
    const sentence = raw.split(/[。！？；;]/)[0]?.trim() || raw;
    const clipped = sentence.length > 72 ? `${sentence.slice(0, 72).replace(/[，,。；; ]+$/, '')}…` : sentence;
    return clipped ? `${clipped}。` : '';
}
function sleep(ms = 420) {
    return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}
function uid(prefix: string) {
    return `${prefix}_${window.crypto.randomUUID().slice(0, 8)}`;
}
function readJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined')
        return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    }
    catch {
        return fallback;
    }
}
function writeJson(key: string, value: unknown) {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
}
function targetKeyFromVideoId(videoId: string) {
    if (videoId.includes('pink_tutorial')) return 'pink';
    if (videoId.includes('tea_tutorial')) return 'tea';
    return Object.keys(TARGET_META).find((key) => videoId.includes(key)) ?? 'blue';
}
function colorWithoutConfidence(color: HairColor): HairColor {
    const { confidence, ...confirmed } = color;
    void confidence;
    return confirmed;
}
const DEMO_CURRENT_COLORS: Record<string, HairColor> = {
    blue: {
        tone: 'gray',
        level: 8,
        saturation: 'light',
        display_name: '8 度银灰演示底',
        rgb: { r: 178, g: 184, b: 190 },
        confidence: 0.8,
    },
    purple: {
        tone: 'blue',
        level: 8,
        saturation: 'medium',
        display_name: '8 度蓝紫演示底',
        rgb: { r: 98, g: 112, b: 170 },
        confidence: 0.8,
    },
    red: {
        tone: 'yellow',
        level: 8,
        saturation: 'medium',
        display_name: '8 度暖金演示底',
        rgb: { r: 218, g: 185, b: 115 },
        confidence: 0.78,
    },
    pink: {
        tone: 'yellow',
        level: 9,
        saturation: 'light',
        display_name: '9 度浅金演示底',
        rgb: { r: 232, g: 205, b: 142 },
        confidence: 0.78,
    },
    cold_tea: {
        tone: 'natural_black',
        level: 3,
        saturation: 'dark',
        display_name: '3 度自然黑演示底',
        rgb: { r: 38, g: 31, b: 27 },
        confidence: 0.78,
    },
    cold_brown: {
        tone: 'yellow',
        level: 8,
        saturation: 'medium',
        display_name: '8 度暖金演示底',
        rgb: { r: 218, g: 185, b: 115 },
        confidence: 0.78,
    },
};
function demoCurrentColor(targetKey: string) {
    return DEMO_CURRENT_COLORS[targetKey] ?? CURRENT_GOLD;
}
function demoCurrentColorOptions(targetKey: string): HairColor[] {
    const primary = demoCurrentColor(targetKey);
    if (targetKey === 'blue') {
        return [
            primary,
            { tone: 'silver', level: 9, saturation: 'light', display_name: '9 度银色演示底' },
            { tone: 'blue', level: 8, saturation: 'medium', display_name: '8 度蓝色演示底' },
        ];
    }
    if (targetKey === 'purple') {
        return [
            primary,
            { tone: 'purple', level: 8, saturation: 'medium', display_name: '8 度紫色演示底' },
            { tone: 'red', level: 7, saturation: 'medium', display_name: '7 度红色演示底' },
        ];
    }
    if (targetKey === 'cold_tea') {
        return [
            primary,
            { tone: 'brown', level: 5, saturation: 'dark', display_name: '5 度棕色演示底' },
            { tone: 'purple', level: 6, saturation: 'medium', display_name: '6 度紫色演示底' },
        ];
    }
    return [
        primary,
        { tone: 'yellow_orange', level: 7, saturation: 'medium', display_name: '7 度橘金演示底' },
        { tone: 'yellow', level: 9, saturation: 'light', display_name: '9 度浅金演示底' },
    ];
}
const profileStore = new Map<string, HairProfileData>();
const profileEntryStore = new Map<string, {
    entryVideoId: string;
    currentImageId: string;
}>();
const planStore = new Map<string, PlanResultData>();
const previewTaskStore = new Map<string, {
    polls: number;
    images: PreviewImage[];
}>();
const recommendationStore = new Map<string, ProductRecommendationData>();
const planSelections = new Map<string, {
    route: RouteType;
    intensity: number;
}>();
const afterTaskPolls = new Map<string, number>();
const afterTaskByImage = new Map<string, string>();
const MOCK_TUTORIAL_URL_BY_ID: Record<string, string> = {
    tutorial_blue: '/mock-assets/blue/tutorial.mp4',
    tutorial_red: '/mock-assets/red/tutorial.mp4',
    tutorial_purple: '/mock-assets/purple/tutorial.mp4',
    tutorial_pink: '/mock-assets/pink/tutorial.mp4',
    tutorial_cold_tea: '/mock-assets/cold_tea/tutorial.mp4',
    tutorial_cold_brown: '/mock-assets/cold_brown/tutorial.mp4',
};
function normalizeTutorialVideoId(videoId?: string | null) {
    const map: Record<string, string> = {
        blue_tutorial: 'tutorial_blue',
        red_tutorial: 'tutorial_red',
        purple_tutorial: 'tutorial_purple',
        pink_tutorial: 'tutorial_pink',
        tea_tutorial: 'tutorial_cold_tea',
        brown_tutorial: 'tutorial_cold_brown',
    };
    return map[videoId ?? ''] ?? videoId ?? 'tutorial_blue';
}
function tutorialVideoIdForMockArchive(product: {
    sku_id?: string;
    shade_name?: string;
}) {
    const value = `${product.sku_id ?? ''} ${product.shade_name ?? ''}`;
    if (/red|红/i.test(value))
        return 'tutorial_red';
    if (/purple|violet|紫/i.test(value))
        return 'tutorial_purple';
    if (/pink|粉/i.test(value))
        return 'tutorial_pink';
    if (/tea|茶/i.test(value))
        return 'tutorial_cold_tea';
    if (/blue|蓝/i.test(value))
        return 'tutorial_blue';
    if (/brown|棕|hazel|mist|cool/i.test(value))
        return 'tutorial_cold_brown';
    return 'tutorial_blue';
}
function loadArchives(): ArchiveDetailData[] {
    return readJson<ArchiveDetailData[]>(ARCHIVE_STORAGE, []).map(archive => {
        const video = MOCK_VIDEOS.find(v => v.video_id === archive.entry_video_id);
        return { ...archive, selected_preview_image_url: archive.selected_preview_image_url ?? video?.target_frame_url ?? null,
          tutorial_video_id: video?.bound_tutorial_video_id ? normalizeTutorialVideoId(video.bound_tutorial_video_id) : archive.tutorial_video_id };
    });
}
function saveArchives(archives: ArchiveDetailData[]) {
    writeJson(ARCHIVE_STORAGE, archives);
}
function loadSessions() {
    return readJson<Record<string, TutorialSessionData>>(SESSION_STORAGE, {});
}
function saveSessions(sessions: Record<string, TutorialSessionData>) {
    writeJson(SESSION_STORAGE, sessions);
}
export function saveFlowDraft(draft: FlowDraft) {
    writeJson(DRAFT_STORAGE, draft);
}
export function loadFlowDraft() {
    const draft = readJson<FlowDraft | null>(DRAFT_STORAGE, null);
    if (draft) {
        profileStore.set(draft.profile.profile_id, draft.profile);
        profileEntryStore.set(draft.profile.profile_id, { entryVideoId: draft.video.video_id, currentImageId: draft.currentImageId });
    }
    return draft;
}
export function clearFlowDraft() {
    if (typeof window !== 'undefined')
        window.localStorage.removeItem(DRAFT_STORAGE);
}
export async function getMockVideos(signal?: AbortSignal): Promise<MockVideosData> {
    await sleep(360);
    return { videos: DISCOVERY_VIDEOS };
}
export async function uploadImage(file: File, mediaType: 'current_hair' | 'after_hair'): Promise<MediaImageData> {
    await sleep(520);
    const imageId = uid(mediaType === 'current_hair' ? 'img_current' : 'img_after');
    const data: MediaImageData = {
        image_id: imageId,
        media_type: mediaType,
        storage_key: `uploads/${mediaType === 'current_hair' ? 'current' : 'after'}/${imageId}.jpg`,
        url: await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('照片读取失败')); reader.readAsDataURL(file); }),
    };
    const images = readJson<Record<string, string>>(IMAGE_STORAGE, {});
    images[imageId] = data.url;
    writeJson(IMAGE_STORAGE, images);
    return data;
}
export async function createHairProfile(input: {
    entry_video_id: string;
    current_image_id: string;
}): Promise<HairProfileData> {
    await sleep(760);
    const targetKey = targetKeyFromVideoId(input.entry_video_id);
    const target = TARGET_META[targetKey].color;
    const profileId = uid('profile');
    const pudding = targetKey === 'blue' || targetKey === 'purple';
    const profile: HairProfileData = {
        profile_id: profileId,
        status: 'need_confirm',
        target_color: target,
        current_hair: pudding
            ? {
                region_mode: 'root_mid_end',
                regions: {
                    root: {
                        color: {
                            tone: 'natural_black',
                            level: 3,
                            saturation: 'dark',
                            display_name: '3 度自然黑新根',
                            confidence: 0.88,
                        },
                    },
                    mid: {
                        color: {
                            tone: 'yellow_orange',
                            level: 7,
                            saturation: 'medium',
                            display_name: '7 度橘金',
                            confidence: 0.72,
                        },
                    },
                    end: {
                        color: CURRENT_GOLD,
                        color_options: CURRENT_COLOR_OPTIONS,
                    },
                },
            }
            : {
                region_mode: 'single',
                color: CURRENT_GOLD,
                color_options: CURRENT_COLOR_OPTIONS,
            },
        hair_length: 'chest',
        hair_volume: 'medium',
        dye_history: 'dyed_no_bleach',
        attribute_confidences: {
            hair_length: 0.85,
            hair_volume: 0.72,
            dye_history: 0.68,
            current_color: pudding ? 0.72 : 0.76,
            target_color: target.confidence ?? 0.92,
        },
        editable_options: EDITABLE_OPTIONS,
    };
    profileStore.set(profileId, profile);
    profileEntryStore.set(profileId, {
        entryVideoId: input.entry_video_id,
        currentImageId: input.current_image_id,
    });
    return profile;
}
export async function updateHairProfile(profileId: string, update: HairProfileUpdate): Promise<HairProfileConfirmationData> {
    await sleep(360);
    const existing = profileStore.get(profileId);
    if (!existing)
        throw new ApiError('没有找到这次发色识别，请重新开始');
    const confirmed: HairProfileData = {
        ...existing,
        status: 'confirmed',
        target_color: update.target_color ?? existing.target_color,
        current_hair: update.current_hair,
        hair_length: update.hair_length,
        hair_volume: update.hair_volume,
        dye_history: update.dye_history,
    };
    profileStore.set(profileId, confirmed);
    return { profile_id: profileId, status: 'confirmed' } satisfies HairProfileConfirmationData;
}
export async function createDemoProfile(input: {
    source_profile_id: string;
    entry_video_id: string;
}): Promise<HairProfileData> {
    await sleep(320);
    const source = profileStore.get(input.source_profile_id);
    if (!source)
        throw new ApiError('没有找到真实识别结果，请重新拍照分析');
    const targetKey = targetKeyFromVideoId(input.entry_video_id);
    const target = TARGET_META[targetKey].color;
    const profileId = uid('profile_demo');
    const pudding = targetKey === 'blue' || targetKey === 'purple';
    const currentColor = demoCurrentColor(targetKey);
    const currentColorOptions = demoCurrentColorOptions(targetKey);
    const profile: HairProfileData = {
        profile_id: profileId,
        status: 'confirmed',
        demo_mode: true,
        source_profile_id: input.source_profile_id,
        target_color: target,
        current_hair: pudding
            ? {
                region_mode: 'root_mid_end',
                regions: {
                    root: {
                        color: {
                            tone: 'natural_black',
                            level: 3,
                            saturation: 'dark',
                            display_name: '3 度自然黑新根',
                            confidence: 0.88,
                        },
                    },
                    mid: {
                        color: currentColorOptions[1],
                    },
                    end: {
                        color: currentColor,
                        color_options: currentColorOptions,
                    },
                },
            }
            : {
                region_mode: 'single',
                color: currentColor,
                color_options: currentColorOptions,
            },
        hair_length: 'chest',
        hair_volume: 'medium',
        dye_history: 'dyed_no_bleach',
        attribute_confidences: {
            hair_length: 0.85,
            hair_volume: 0.72,
            dye_history: 0.68,
            current_color: currentColor.confidence ?? 0.78,
            target_color: target.confidence ?? 0.92,
        },
        editable_options: EDITABLE_OPTIONS,
    };
    profileStore.set(profileId, profile);
    profileEntryStore.set(profileId, {
        entryVideoId: input.entry_video_id,
        currentImageId: profileEntryStore.get(input.source_profile_id)?.currentImageId ?? '',
    });
    return profile;
}
export async function getPlanResult(profileId: string): Promise<PlanResultData> {
    await sleep(1350);
    const profile = profileStore.get(profileId);
    if (!profile)
        throw new ApiError('画像已失效，请返回重新确认');
    const targetKey = Object.entries(TARGET_META).find(([, meta]) => meta.color.tone === profile.target_color.tone)?.[0] ?? 'blue';
    const targetMeta = TARGET_META[targetKey];
    const hasBlackHistory = profile.dye_history === 'dyed_black';
    const planId = uid('plan');
    const previewTaskId = uid('preview');
    const previewFrames = [
        '/video-mock/frames/step-1-2.jpg',
        '/video-mock/frames/step-2-2.jpg',
        '/video-mock/frames/step-3-2.jpg',
        '/video-mock/frames/step-4-1.jpg',
        '/video-mock/frames/step-6-3.jpg',
    ];
    const previewImages: PreviewImage[] = previewFrames.map((url, index) => ({
        preview_level: index + 1,
        label: ['柔和低饱和', '偏浅通透', '推荐效果', '鲜明显色', '高饱和效果'][index],
        url,
        enabled: true,
    }));
    const previewLabels = Object.fromEntries(previewImages.map((item) => [String(item.preview_level), item.label]));
    const plan: PlanResultData = {
        profile_id: profileId,
        plan_id: planId,
        feasibility: hasBlackHistory ? 'salon_required' : 'conditional',
        summary: hasBlackHistory
            ? '染黑史会明显阻碍目标色显色，本次不建议在家直接操作。'
            : `可以尝试，但当前暖金底叠加${profile.target_color.display_name}，结果可能${targetMeta.riskName}。`,
        reachability_score: hasBlackHistory ? 34 : targetKey === 'brown' ? 86 : 78,
        risks: hasBlackHistory
            ? [
                {
                    title: '染黑史导致难上色',
                    severity: 'high',
                    reason: '深色人工色素会阻挡目标颜色显现。',
                    suggestion: '建议先由理发店判断并处理，不在家自行漂发。',
                },
            ]
            : [
                {
                    title: `可能${targetMeta.riskName}`,
                    severity: 'medium',
                    reason: `当前暖黄底会与${profile.target_color.display_name}发生颜色叠加。`,
                    suggestion: '把五档预览当作结果范围，并优先选择推荐档位。',
                },
                ...(profile.current_hair.region_mode === 'root_mid_end'
                    ? [
                        {
                            title: '根尾可能不完全一致',
                            severity: 'medium' as const,
                            reason: '发根较深，发中和发尾底色更浅。',
                            suggestion: '操作时需要分区控制上色顺序和停留时间。',
                        },
                    ]
                    : []),
            ],
        preview_status: 'generating',
        preview_task_id: previewTaskId,
        preview_images: [],
        preview_labels: previewLabels,
        route_cards: [
            {
                route: 'dye',
                title: '染色',
                recommended: true,
                reason: '维持时间更长，在当前底色上更接近目标色。',
            },
            {
                route: 'color_deposit',
                title: '固色',
                recommended: false,
                reason: '操作更简单，适合浅底色补色或短期改色。',
            },
        ],
        default_route: 'dye',
        default_preview_level: 3,
        can_recommend_product: !hasBlackHistory,
        color_rule: {
            source: 'color_effect_matrix',
            matched_color_name: profile.target_color.display_name,
            primary_tone: profile.target_color.tone,
            current_level: 6,
            matrix_color_id: `${profile.target_color.tone}_6`,
            result_quality: hasBlackHistory ? 'not_recommended' : 'biased',
            recommended: !hasBlackHistory,
            official_result_color: hasBlackHistory
                ? null
                : {
                    rgb: profile.target_color.rgb ?? { r: 74, g: 113, b: 148 },
                    hex: targetMeta.accent,
                    rgb_quality: 'mock_reference',
                },
        },
    };
    planStore.set(planId, plan);
    previewTaskStore.set(previewTaskId, { polls: 0, images: previewImages });
    return plan;
}
export async function getPreviewTask(previewTaskId: string): Promise<PreviewTaskData> {
    await sleep(240);
    const task = previewTaskStore.get(previewTaskId);
    if (!task)
        throw new ApiError('效果预览任务不存在，请重新生成方案');
    task.polls += 1;
    previewTaskStore.set(previewTaskId, task);
    if (task.polls < 3) {
        return {
            preview_task_id: previewTaskId,
            status: 'generating',
            progress_percent: Math.min(88, task.polls * 34),
            preview_images: [],
        } satisfies PreviewTaskData;
    }
    return {
        preview_task_id: previewTaskId,
        status: 'completed',
        preview_images: task.images,
    } satisfies PreviewTaskData;
}
export async function getProductRecommendations(input: {
    profile_id: string;
    plan_id: string;
    selected_route: RouteType;
    selected_preview_level: number;
    budget: Budget;
}): Promise<ProductRecommendationData> {
    await sleep(920);
    const profile = profileStore.get(input.profile_id);
    if (!profile) throw new ApiError('方案已失效，请重新选择目标发色');
    const candidates = productsForRoute(input.selected_route, profile.target_color).filter(({ primary }) => primary.price.total_price >= input.budget.min_price &&
        primary.price.total_price <= input.budget.max_price);
    const recommendationId = uid('recommendation');
    const data: ProductRecommendationData = candidates.length
        ? {
            profile_id: input.profile_id,
            plan_id: input.plan_id,
            recommendation_id: recommendationId,
            status: 'available',
            selected_route: input.selected_route,
            risk_level: 'medium',
            risk_summary: '当前底色可推荐商品，但需要明确接受偏色风险。',
            color_rule: {
                source: 'color_effect_matrix',
                result_quality: 'biased',
                recommended: true,
            },
            primary_product: candidates.find(({ primary }) => primary.is_video_same_product)?.primary ??
                candidates[0].primary,
            other_products: candidates
                .filter(({ primary }) => primary.sku_id !==
                (candidates.find(({ primary }) => primary.is_video_same_product)?.primary
                    .sku_id ?? candidates[0].primary.sku_id))
                .map(({ other }) => other),
        }
        : {
            profile_id: input.profile_id,
            plan_id: input.plan_id,
            recommendation_id: recommendationId,
            status: 'no_match',
            selected_route: input.selected_route,
            color_rule: {
                source: 'color_effect_matrix',
                result_quality: 'normal',
                recommended: true,
            },
            primary_product: null,
            other_products: [],
            message: '当前预算和方案下暂未找到合适商品',
        };
    recommendationStore.set(recommendationId, data);
    planSelections.set(input.plan_id, {
        route: input.selected_route,
        intensity: input.selected_preview_level,
    });
    return data;
}
export async function createArchive(input: {
    profile_id: string;
    plan_id: string;
    recommendation_id: string;
    sku_id: string;
    purchase_status: PurchaseStatus;
    selected_route?: RouteType;
    selected_preview_level?: number;
}): Promise<ArchiveCreateData> {
    await sleep(620);
    const profile = profileStore.get(input.profile_id);
    const plan = planStore.get(input.plan_id);
    const recommendation = recommendationStore.get(input.recommendation_id);
    if (!profile || !plan || !recommendation) {
        throw new ApiError('方案信息不完整，请返回商品页重新确认');
    }
    const selectedProduct = recommendation.primary_product?.sku_id === input.sku_id
        ? recommendation.primary_product
        : recommendation.other_products.find((product) => product.sku_id === input.sku_id);
    if (!selectedProduct)
        throw new ApiError('没有找到已选择的商品');
    const product = productsForRoute(input.selected_route ?? recommendation.selected_route, profile.target_color)
        .find(item => item.primary.sku_id === input.sku_id)?.primary;
    if (!product) throw new ApiError('商品资料已更新，请重新选择');
    const createdAt = new Date().toISOString();
    const archiveId = uid('archive');
    const selection = planSelections.get(input.plan_id) ?? {
        route: plan.default_route,
        intensity: plan.default_preview_level,
    };
    const entry = profileEntryStore.get(input.profile_id);
    const video = MOCK_VIDEOS.find(item => item.video_id === entry?.entryVideoId);
    const tutorialVideoId = video?.bound_tutorial_video_id
        ? normalizeTutorialVideoId(video.bound_tutorial_video_id)
        : tutorialVideoIdForMockArchive({ shade_name: profile.target_color.display_name });
    const images = readJson<Record<string, string>>(IMAGE_STORAGE, {});
    const draft = loadFlowDraft();
    const detail: ArchiveDetailData = {
        archive_id: archiveId,
        created_at: createdAt,
        purchase_status: input.purchase_status,
        entry_video_id: entry?.entryVideoId ?? '',
        current_image_id: entry?.currentImageId,
        current_image_url: images[entry?.currentImageId ?? ''] ?? (draft?.profile.profile_id === input.profile_id ? draft.currentPhotoUrl : null),
        selected_preview_image_url: video?.target_frame_url ?? null,
        profile_snapshot: {
            current_hair: profile.current_hair,
            target_color: colorWithoutConfidence(profile.target_color),
            hair_length: profile.hair_length,
            hair_volume: profile.hair_volume,
            dye_history: profile.dye_history,
        },
        plan_snapshot: {
            plan_id: plan.plan_id,
            feasibility: plan.feasibility,
            summary: plan.summary,
            reachability_score: plan.reachability_score,
            selected_route: selection.route,
            selected_preview_level: selection.intensity,
            default_preview_level: plan.default_preview_level,
            risks: plan.risks,
        },
        product_snapshot: {
            ...product,
            recommendation_id: input.recommendation_id,
        },
        tutorial_video_id: tutorialVideoId,
        tutorial_available: true,
        after_video_url: null,
    };
    const archives = loadArchives();
    archives.unshift(detail);
    saveArchives(archives);
    return { archive_id: archiveId, created_at: createdAt };
}
export async function getArchives(): Promise<ArchiveListData> {
    await sleep(420);
    const sessions = Object.values(loadSessions());
    return { archives: loadArchives().map(detail => {
        const summary = toArchiveSummary(detail);
        const session = sessions.find(item => item.archive_id === detail.archive_id);
        return session && !detail.completion_record ? { ...summary, status: 'in_progress' as const, current_step_no: session.current_step.step_no, total_steps: session.current_step.total_steps } : summary;
    }) };
}
export async function getArchive(archiveId: string): Promise<ArchiveDetailData> {
    await sleep(380);
    const archive = loadArchives().find((item) => item.archive_id === archiveId);
    if (!archive)
        throw new ApiError('没有找到这份染发档案');
    return archive;
}
export function saveLocalCompletion(archiveId: string, completionRecord: CompletionRecord) {
    const archives = loadArchives();
    const index = archives.findIndex((item) => item.archive_id === archiveId);
    if (index < 0)
        return;
    archives[index] = { ...archives[index], completion_record: completionRecord };
    saveArchives(archives);
}
export async function createCompletionRecord(tutorialSessionId: string, archiveId: string, qaSummary: string[]): Promise<CompletionRecord> {
    await sleep(260);
    const session = loadSessions()[tutorialSessionId];
    const totalSteps = session?.current_step.total_steps ?? TUTORIAL_STEPS.length;
    const completionRecord: CompletionRecord = {
        completed_at: new Date().toISOString(),
        total_minutes: 42,
        completed_steps: totalSteps,
        total_steps: totalSteps,
        qa_summary: Array.from(new Set(qaSummary.map((item) => qaSummaryStatement(item)).filter(Boolean))).slice(-4),
        care_notes: [
            '前 48 小时尽量减少洗头。',
            '使用温和、偏凉的水清洗，减少快速掉色。',
            '如头皮出现持续不适，请停止使用并及时咨询专业人士。',
        ],
    };
    saveLocalCompletion(archiveId, completionRecord);
    return completionRecord;
}
export async function createTutorialSession(archiveId: string): Promise<TutorialSessionData> {
    await sleep(540);
    const archive = loadArchives().find((item) => item.archive_id === archiveId);
    if (!archive) throw new ApiError('档案不存在，请先保存方案');
    const previous = Object.values(loadSessions()).find(item => item.archive_id === archiveId && item.status === 'active');
    if (previous) return getTutorialSession(previous.tutorial_session_id);
    const tutorialVideoId = normalizeTutorialVideoId(archive?.tutorial_video_id);
    const tutorialSteps = TUTORIAL_STEPS_BY_VIDEO_ID[tutorialVideoId] ?? TUTORIAL_STEPS;
    const sessionId = uid('tutorial_session');
    const session: TutorialSessionData = {
        tutorial_session_id: sessionId,
        archive_id: archiveId,
        status: 'active',
        tutorial_video: {
            video_id: tutorialVideoId,
            url: MOCK_TUTORIAL_URL_BY_ID[tutorialVideoId] ?? '/mock-assets/blue/tutorial.mp4',
        },
        tutorial_steps: tutorialSteps,
        current_step: tutorialSteps[0],
        step_end_tts: {
            text: '你在这一步有什么问题，可以随时问我～',
            audio_url: null,
        },
        completed_step_count: 0,
    };
    const sessions = loadSessions();
    sessions[sessionId] = session;
    saveSessions(sessions);
    return session;
}
export async function getTutorialSession(sessionId: string): Promise<TutorialSessionData> {
    await sleep(260);
    const session = loadSessions()[sessionId];
    if (!session)
        throw new ApiError('教程会话已失效，请从档案重新进入');
    const steps = TUTORIAL_STEPS_BY_VIDEO_ID[session.tutorial_video.video_id];
    if (steps) { session.tutorial_steps = steps; session.current_step = steps[Math.min(session.current_step.step_no - 1, steps.length - 1)]; }
    return session;
}
export async function sendTutorialVoiceInput(sessionId: string, input: {
    current_step_id: string;
    client_event_id: string;
    audio: File;
}): Promise<TutorialAction> {
    await sleep(620);
    const sessions = loadSessions();
    const session = sessions[sessionId];
    if (!session)
        throw new ApiError('教程会话已失效');
    const tutorialSteps = session.tutorial_steps?.length
        ? session.tutorial_steps
        : TUTORIAL_STEPS;
    const isNext = input.audio.name.includes('command-next');
    const isFinish = input.audio.name.includes('command-finish');
    const text = isNext ? '下一步' : isFinish ? '结束了' : '这一步需要注意什么？';
    const currentStepId = session.current_step?.step_id || input.current_step_id;
    const currentIndex = tutorialSteps.findIndex((step) => step.step_id === currentStepId);
    if (isFinish) {
        session.status = 'completed';
        sessions[sessionId] = session;
        saveSessions(sessions);
        return {
            action: 'capture_after_photo',
            asr_transcript: '结束了',
            tts_text: '好的，本次染发教程已结束。我会先为你整理完成记录。',
            tts_audio_url: null,
        } satisfies TutorialAction;
    }
    if (isNext) {
        if (currentIndex >= tutorialSteps.length - 1) {
            session.status = 'completed';
            sessions[sessionId] = session;
            saveSessions(sessions);
            return {
                action: 'capture_after_photo',
                asr_transcript: '下一步',
                tts_text: '全部步骤已经完成。我会先为你整理本次染发记录。',
                tts_audio_url: null,
            } satisfies TutorialAction;
        }
        const nextStep = tutorialSteps[Math.max(0, currentIndex) + 1];
        session.current_step = nextStep;
        session.tutorial_steps = tutorialSteps;
        session.step_end_tts = {
            text: '你在这一步有什么问题，可以随时问我～',
            audio_url: null,
        };
        session.completed_step_count = currentIndex + 1;
        session.last_event_id = input.client_event_id;
        sessions[sessionId] = session;
        saveSessions(sessions);
        return {
            action: 'play_next_step',
            asr_transcript: '下一步',
            current_step: nextStep,
            tts_text: '你在这一步有什么问题，可以随时问我～',
            step_end_tts: {
                text: '你在这一步有什么问题，可以随时问我～',
                audio_url: null,
            },
        } satisfies TutorialAction;
    }
    const answer = '先暂停视频并检查当前步骤说明。如果商品包装上的要求与教程不同，请以商品官方说明为准。';
    return {
        action: 'answer',
        asr_transcript: text,
        tts_text: answer,
        tts_audio_url: null,
        answer: {
            answer_id: 'OP021',
            category: '当前步骤操作问答',
        },
        next_prompt: '处理好后可以说“下一步”，继续后面的操作。',
    } satisfies TutorialAction;
}
export async function advanceTutorialStep(sessionId: string, clientEventId?: string): Promise<TutorialAction> {
    await sleep(240);
    const sessions = loadSessions();
    const session = sessions[sessionId];
    if (!session)
        throw new ApiError('教程会话已失效');
    const tutorialSteps = session.tutorial_steps?.length
        ? session.tutorial_steps
        : TUTORIAL_STEPS;
    const currentStepId = session.current_step?.step_id;
    const currentIndex = tutorialSteps.findIndex((step) => step.step_id === currentStepId);
    if (currentIndex >= tutorialSteps.length - 1) {
        session.status = 'completed';
        sessions[sessionId] = session;
        saveSessions(sessions);
        return {
            action: 'capture_after_photo',
            asr_transcript: '下一步',
            tts_text: '全部步骤已经完成。我会先为你整理本次染发记录。',
            tts_audio_url: null,
        } satisfies TutorialAction;
    }
    const nextStep = tutorialSteps[Math.max(0, currentIndex) + 1];
    session.current_step = nextStep;
    session.tutorial_steps = tutorialSteps;
    session.step_end_tts = {
        text: '你在这一步有什么问题，可以随时问我～',
        audio_url: null,
    };
    session.completed_step_count = Math.max(0, nextStep.step_no - 1);
    sessions[sessionId] = session;
    saveSessions(sessions);
    return {
        action: 'play_next_step',
        asr_transcript: '下一步',
        current_step: nextStep,
        tts_text: '你在这一步有什么问题，可以随时问我～',
        step_end_tts: session.step_end_tts,
    } satisfies TutorialAction;
}
/** 按步号直接跳转，给「上一步 / 下一步」按钮兜底。步号越界由后端钳制。 */
export async function gotoTutorialStep(sessionId: string, stepNo: number): Promise<TutorialAction> {
    await sleep(200);
    const sessions = loadSessions();
    const session = sessions[sessionId];
    if (!session)
        throw new ApiError('教程会话已失效');
    const tutorialSteps = session.tutorial_steps?.length
        ? session.tutorial_steps
        : TUTORIAL_STEPS;
    const index = Math.min(Math.max(stepNo - 1, 0), tutorialSteps.length - 1);
    const target = tutorialSteps[index];
    session.current_step = target;
    session.tutorial_steps = tutorialSteps;
    session.step_end_tts = {
        text: '你在这一步有什么问题，可以随时问我～',
        audio_url: null,
    };
    // 取历史最大值：往回退不该把已完成进度改小
    session.completed_step_count = Math.max(session.completed_step_count ?? 0, index);
    sessions[sessionId] = session;
    saveSessions(sessions);
    return {
        action: 'play_next_step',
        current_step: target,
        tts_text: '你在这一步有什么问题，可以随时问我～',
        step_end_tts: session.step_end_tts,
    } satisfies TutorialAction;
}
export async function submitAfterPhoto(tutorialSessionId: string, afterImageId: string): Promise<AfterPhotoData> {
    await sleep(480);
    const idempotencyKey = `${tutorialSessionId}:${afterImageId}`;
    const taskId = afterTaskByImage.get(idempotencyKey) ?? uid('after_video');
    afterTaskByImage.set(idempotencyKey, taskId);
    if (!afterTaskPolls.has(taskId))
        afterTaskPolls.set(taskId, 0);
    return {
        generation_task_id: taskId,
        status: 'queued',
        message: '正在排队生成你的染后转场视频。',
    };
}
export async function getAfterVideoTask(taskId: string): Promise<AfterVideoTaskData> {
    await sleep(260);
    const polls = (afterTaskPolls.get(taskId) ?? 0) + 1;
    afterTaskPolls.set(taskId, polls);
    if (polls < 4) {
        return {
            generation_task_id: taskId,
            status: 'generating',
            progress_percent: Math.min(88, polls * 24),
            message: '正在生成你的染后短视频，请稍候。',
        } satisfies AfterVideoTaskData;
    }
    return {
        generation_task_id: taskId,
        status: 'completed',
        url: '/mock-assets/blue/transition.mp4',
        cover_url: '/video-mock/frames/step-6-3.jpg',
    } satisfies AfterVideoTaskData;
}

export const API_MODE = 'mock';
export async function getColorMatrix(_signal?: AbortSignal): Promise<ColorMatrix> {
 const aliases: Record<string,string> = { red: '红色', purple: '紫色', pink: '粉色', blue: '蓝色', brown: '奶茶灰棕', tea: '黑茶色' };
 return { ...matrixData, videos: DISCOVERY_VIDEOS.map(v => ({video_id:v.video_id, title:v.title, color_name:v.color_name, accent:v.accent ?? null, cover_url:v.cover_url, kb_color:(v.video_id.includes('pink_tutorial') ? '粉色' : v.video_id.includes('tea_tutorial') ? '黑茶色' : aliases[v.video_id.split('_')[1]]) ?? null})) } as ColorMatrix;
}
export async function synthesizeSpeech(_text: string): Promise<string | null> { return null; }
