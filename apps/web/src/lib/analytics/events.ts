export const PAGE_KEYS = {
  '/': 'home',
  '/register': 'register',
  '/login': 'login',
  '/career': 'career',
} as const;

export type AnalyticsEnvironment = 'production' | 'staging' | 'preview' | 'development';
export type AnalyticsSurface = 'web' | 'native_webview';
export type AuthState = 'anonymous' | 'authenticated';
export type PageKey = (typeof PAGE_KEYS)[keyof typeof PAGE_KEYS];
export type RecommendationSource = 'home' | 'explore';

export type AnalyticsEventName =
  | 'page_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'login_completed'
  | 'oauth_completed'
  | 'career_target_created'
  | 'career_evidence_submitted'
  | 'recommendation_list_viewed'
  | 'recommendation_selected'
  | 'roadmap_viewed'
  | 'learning_node_opened'
  | 'learning_resource_opened'
  | 'learning_node_completion_changed';

export type AnalyticsEventInput = {
  page_viewed: { page_key: PageKey; auth_state: AuthState };
  signup_started: { method: 'email' };
  signup_completed: { method: 'email'; links_count_bucket: '0' | '1' | '2' | '3' };
  login_completed: { method: 'email' };
  oauth_completed: Record<never, never>;
  career_target_created: {
    competency_count_bucket: '1' | '2-3' | '4+';
    has_posting_url: boolean;
    requirements_length_bucket: '20-499' | '500-1999' | '2000-4999' | '5000-20000';
  };
  career_evidence_submitted: {
    evidence_kind: 'GITHUB_PULL_REQUEST' | 'GITHUB_REPOSITORY' | 'DEPLOYMENT' | 'ARTICLE' | 'OTHER';
    competency_count_bucket: '1' | '2-3' | '4+';
    has_description: boolean;
  };
  recommendation_list_viewed: {
    source: RecommendationSource;
    result_count_bucket: '0' | '1-3' | '4+';
  };
  recommendation_selected: { source: RecommendationSource };
  roadmap_viewed: Record<never, never>;
  learning_node_opened: { completion_state: 'completed' | 'incomplete' };
  learning_resource_opened: Record<never, never>;
  learning_node_completion_changed: { action: 'completed' | 'uncompleted' };
};

export type AnalyticsCommonProperties = {
  schema_version: 1;
  environment: AnalyticsEnvironment;
  surface: AnalyticsSurface;
};

export type AnalyticsEventProperties<TEvent extends AnalyticsEventName = AnalyticsEventName> =
  AnalyticsCommonProperties & AnalyticsEventInput[TEvent];

const EVENT_NAMES = new Set<AnalyticsEventName>([
  'page_viewed',
  'signup_started',
  'signup_completed',
  'login_completed',
  'oauth_completed',
  'career_target_created',
  'career_evidence_submitted',
  'recommendation_list_viewed',
  'recommendation_selected',
  'roadmap_viewed',
  'learning_node_opened',
  'learning_resource_opened',
  'learning_node_completion_changed',
]);

const ENVIRONMENTS = new Set<AnalyticsEnvironment>([
  'production',
  'staging',
  'preview',
  'development',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

export function isAnalyticsEnvironment(value: unknown): value is AnalyticsEnvironment {
  return typeof value === 'string' && ENVIRONMENTS.has(value as AnalyticsEnvironment);
}

export function getPageKey(pathname: string): PageKey | null {
  return Object.prototype.hasOwnProperty.call(PAGE_KEYS, pathname)
    ? PAGE_KEYS[pathname as keyof typeof PAGE_KEYS]
    : null;
}

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === 'string' && EVENT_NAMES.has(value as AnalyticsEventName);
}

export function validateAnalyticsEventProperties<TEvent extends AnalyticsEventName>(
  event: TEvent,
  properties: unknown,
): properties is AnalyticsEventProperties<TEvent> {
  if (!isRecord(properties)) return false;

  const commonKeys = ['schema_version', 'environment', 'surface'];
  if (
    properties.schema_version !== 1 ||
    !isAnalyticsEnvironment(properties.environment) ||
    (properties.surface !== 'web' && properties.surface !== 'native_webview')
  ) {
    return false;
  }

  switch (event) {
    case 'page_viewed':
      return (
        hasOnlyKeys(properties, [...commonKeys, 'page_key', 'auth_state']) &&
        typeof properties.page_key === 'string' &&
        Object.values(PAGE_KEYS).includes(properties.page_key as PageKey) &&
        (properties.auth_state === 'anonymous' || properties.auth_state === 'authenticated')
      );
    case 'signup_started':
    case 'login_completed':
      return hasOnlyKeys(properties, [...commonKeys, 'method']) && properties.method === 'email';
    case 'signup_completed':
      return (
        hasOnlyKeys(properties, [...commonKeys, 'method', 'links_count_bucket']) &&
        properties.method === 'email' &&
        (properties.links_count_bucket === '0' ||
          properties.links_count_bucket === '1' ||
          properties.links_count_bucket === '2' ||
          properties.links_count_bucket === '3')
      );
    case 'oauth_completed':
      return hasOnlyKeys(properties, commonKeys);
    case 'career_target_created':
      return (
        hasOnlyKeys(properties, [
          ...commonKeys,
          'competency_count_bucket',
          'has_posting_url',
          'requirements_length_bucket',
        ]) &&
        (properties.competency_count_bucket === '1' ||
          properties.competency_count_bucket === '2-3' ||
          properties.competency_count_bucket === '4+') &&
        typeof properties.has_posting_url === 'boolean' &&
        (properties.requirements_length_bucket === '20-499' ||
          properties.requirements_length_bucket === '500-1999' ||
          properties.requirements_length_bucket === '2000-4999' ||
          properties.requirements_length_bucket === '5000-20000')
      );
    case 'career_evidence_submitted':
      return (
        hasOnlyKeys(properties, [
          ...commonKeys,
          'evidence_kind',
          'competency_count_bucket',
          'has_description',
        ]) &&
        (properties.evidence_kind === 'GITHUB_PULL_REQUEST' ||
          properties.evidence_kind === 'GITHUB_REPOSITORY' ||
          properties.evidence_kind === 'DEPLOYMENT' ||
          properties.evidence_kind === 'ARTICLE' ||
          properties.evidence_kind === 'OTHER') &&
        (properties.competency_count_bucket === '1' ||
          properties.competency_count_bucket === '2-3' ||
          properties.competency_count_bucket === '4+') &&
        typeof properties.has_description === 'boolean'
      );
    case 'recommendation_list_viewed':
      return (
        hasOnlyKeys(properties, [...commonKeys, 'source', 'result_count_bucket']) &&
        (properties.source === 'home' || properties.source === 'explore') &&
        (properties.result_count_bucket === '0' ||
          properties.result_count_bucket === '1-3' ||
          properties.result_count_bucket === '4+')
      );
    case 'recommendation_selected':
      return (
        hasOnlyKeys(properties, [...commonKeys, 'source']) &&
        (properties.source === 'home' || properties.source === 'explore')
      );
    case 'roadmap_viewed':
    case 'learning_resource_opened':
      return hasOnlyKeys(properties, commonKeys);
    case 'learning_node_opened':
      return (
        hasOnlyKeys(properties, [...commonKeys, 'completion_state']) &&
        (properties.completion_state === 'completed' ||
          properties.completion_state === 'incomplete')
      );
    case 'learning_node_completion_changed':
      return (
        hasOnlyKeys(properties, [...commonKeys, 'action']) &&
        (properties.action === 'completed' || properties.action === 'uncompleted')
      );
  }
}
