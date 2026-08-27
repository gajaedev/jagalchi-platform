'use client';

import posthog from 'posthog-js';

import { hasNativeBridge } from '@/lib/native-bridge';

import {
  type AnalyticsEnvironment,
  type AnalyticsEventInput,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
  type AnalyticsSurface,
  isAnalyticsEnvironment,
  isAnalyticsEventName,
  validateAnalyticsEventProperties,
} from './events';

export const ANALYTICS_IDENTITY_KEY = 'jagalchi:analytics-identity:v1';

type PersistedAnalyticsIdentity =
  { version: 1; state: 'identified'; userId: string } | { version: 1; state: 'reconciling' };

type PostHogWireEvent = {
  event: string;
  uuid: string;
  timestamp?: Date;
  properties: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
};

const APPROVED_HOSTS = new Set(['https://us.i.posthog.com']);
const TRANSPORT_KEYS = [
  'token',
  'distinct_id',
  '$device_id',
  '$session_id',
  '$window_id',
  '$lib',
  '$lib_version',
] as const;
const APP_PROPERTY_KEYS: Record<AnalyticsEventName, readonly string[]> = {
  page_viewed: ['schema_version', 'environment', 'surface', 'page_key', 'auth_state'],
  signup_started: ['schema_version', 'environment', 'surface', 'method'],
  signup_completed: ['schema_version', 'environment', 'surface', 'method', 'links_count_bucket'],
  login_completed: ['schema_version', 'environment', 'surface', 'method'],
  oauth_completed: ['schema_version', 'environment', 'surface'],
  career_target_created: [
    'schema_version',
    'environment',
    'surface',
    'competency_count_bucket',
    'has_posting_url',
    'requirements_length_bucket',
  ],
  career_evidence_submitted: [
    'schema_version',
    'environment',
    'surface',
    'evidence_kind',
    'competency_count_bucket',
    'has_description',
  ],
  recommendation_list_viewed: [
    'schema_version',
    'environment',
    'surface',
    'source',
    'result_count_bucket',
  ],
  recommendation_selected: ['schema_version', 'environment', 'surface', 'source'],
  roadmap_viewed: ['schema_version', 'environment', 'surface'],
  learning_node_opened: ['schema_version', 'environment', 'surface', 'completion_state'],
  learning_resource_opened: ['schema_version', 'environment', 'surface'],
  learning_node_completion_changed: ['schema_version', 'environment', 'surface', 'action'],
};

const MAX_PENDING_EVENTS = 50;

let initialized = false;
let clientAvailable = false;
let identityReady = false;
let documentDisabled = false;
let reconciliationInFlight: { targetUserId: string | null; promise: Promise<boolean> } | null =
  null;
let reconciliationGeneration = 0;
let identityEnding = false;
let pendingEvents: Array<{
  event: AnalyticsEventName;
  properties: AnalyticsEventProperties;
}> = [];

function readConfiguration(): {
  key: string;
  host: string;
  environment: AnalyticsEnvironment;
} | null {
  if (typeof window === 'undefined') return null;
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true') return null;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const environment = process.env.NEXT_PUBLIC_ENV;
  if (
    !key ||
    !host ||
    !isAnalyticsEnvironment(environment) ||
    environment === 'development' ||
    !APPROVED_HOSTS.has(host)
  ) {
    return null;
  }

  return { key, host, environment };
}

export function getAnalyticsEnvironment(): AnalyticsEnvironment | null {
  return readConfiguration()?.environment ?? null;
}

export function getAnalyticsSurface(): AnalyticsSurface {
  return hasNativeBridge() ? 'native_webview' : 'web';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTransportProperties(properties: Record<string, unknown>): boolean {
  return TRANSPORT_KEYS.every(
    (key) =>
      (key === 'distinct_id' && typeof properties[key] === 'number') ||
      (typeof properties[key] === 'string' && properties[key].length > 0),
  );
}

function copyProperties(
  properties: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, properties[key]]));
}

export function sanitizeWireEvent(event: unknown): PostHogWireEvent | null {
  if (!isRecord(event)) return null;
  if (
    typeof event.event !== 'string' ||
    typeof event.uuid !== 'string' ||
    (event.timestamp !== undefined && !(event.timestamp instanceof Date)) ||
    !isRecord(event.properties) ||
    !validTransportProperties(event.properties)
  ) {
    return null;
  }

  if (event.event === '$identify') {
    if (
      !Object.keys(event).every((key) =>
        ['event', 'uuid', 'timestamp', 'properties', '$set', '$set_once'].includes(key),
      ) ||
      typeof event.properties.$anon_distinct_id !== 'string'
    ) {
      return null;
    }

    const result: PostHogWireEvent = {
      event: '$identify',
      uuid: event.uuid,
      properties: copyProperties(event.properties, [...TRANSPORT_KEYS, '$anon_distinct_id']),
      $set: {},
      $set_once: {},
    };
    if (event.timestamp instanceof Date) result.timestamp = event.timestamp;
    return result;
  }

  if (
    !Object.keys(event).every((key) => ['event', 'uuid', 'timestamp', 'properties'].includes(key))
  ) {
    return null;
  }

  if (!isAnalyticsEventName(event.event)) return null;
  const appProperties = copyProperties(event.properties, APP_PROPERTY_KEYS[event.event]);
  if (!validateAnalyticsEventProperties(event.event, appProperties)) return null;

  const result: PostHogWireEvent = {
    event: event.event,
    uuid: event.uuid,
    properties: copyProperties(event.properties, [
      ...TRANSPORT_KEYS,
      ...Object.keys(appProperties),
    ]),
  };
  if (event.timestamp instanceof Date) result.timestamp = event.timestamp;
  return result;
}

function getClient(): typeof posthog | null {
  if (initialized) return clientAvailable ? posthog : null;
  initialized = true;

  const configuration = readConfiguration();
  if (!configuration) return null;

  try {
    posthog.init(configuration.key, {
      api_host: configuration.host,
      defaults: '2026-05-30',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      rageclick: false,
      capture_exceptions: false,
      capture_heatmaps: false,
      capture_performance: false,
      disable_session_recording: true,
      enable_recording_console_log: false,
      disable_surveys: true,
      advanced_disable_flags: true,
      remote_config_refresh_interval_ms: 0,
      person_profiles: 'identified_only',
      persistence: 'localStorage',
      cross_subdomain_cookie: false,
      respect_dnt: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
      custom_campaign_params: [],
      disable_beacon: true,
      before_send: (event) => sanitizeWireEvent(event) as typeof event | null,
    });
    clientAvailable = true;
    return posthog;
  } catch {
    documentDisabled = true;
    return null;
  }
}

function readMarker(): PersistedAnalyticsIdentity | 'anonymous' | 'unsafe' | 'unavailable' {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(ANALYTICS_IDENTITY_KEY);
  } catch {
    return 'unavailable';
  }

  try {
    if (raw === null) return 'anonymous';
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || typeof value.state !== 'string') return 'unsafe';
    if (value.state === 'reconciling' && Object.keys(value).length === 2) {
      return { version: 1, state: 'reconciling' };
    }
    if (
      value.state === 'identified' &&
      typeof value.userId === 'string' &&
      value.userId.length > 0 &&
      Object.keys(value).length === 3
    ) {
      return { version: 1, state: 'identified', userId: value.userId };
    }
    return 'unsafe';
  } catch {
    return 'unsafe';
  }
}

function writeReconcilingMarker(): boolean {
  try {
    window.localStorage.setItem(
      ANALYTICS_IDENTITY_KEY,
      JSON.stringify({ version: 1, state: 'reconciling' }),
    );
    return true;
  } catch {
    return false;
  }
}

function commitMarker(userId: string | null): boolean {
  try {
    if (userId === null) {
      window.localStorage.removeItem(ANALYTICS_IDENTITY_KEY);
    } else {
      window.localStorage.setItem(
        ANALYTICS_IDENTITY_KEY,
        JSON.stringify({ version: 1, state: 'identified', userId }),
      );
    }
    return true;
  } catch {
    return false;
  }
}

function disableAfterCommitFailure(client: typeof posthog, targetUserId: string | null): void {
  let resetSucceeded = false;
  try {
    client.reset();
    resetSucceeded = true;
  } catch {
    // The reconciling marker remains the recovery signal for the next document.
  }
  if (targetUserId !== null && resetSucceeded) commitMarker(null);
  documentDisabled = true;
  identityReady = false;
  pendingEvents = [];
}

function sendEvent(
  client: typeof posthog,
  event: AnalyticsEventName,
  properties: AnalyticsEventProperties,
): boolean {
  try {
    client.capture(event, properties);
    return true;
  } catch {
    return false;
  }
}

function markIdentityReady(client: typeof posthog, generation: number): void {
  if (generation === reconciliationGeneration && !identityEnding && !documentDisabled) {
    identityReady = true;
    const events = pendingEvents;
    pendingEvents = [];
    for (const pending of events) sendEvent(client, pending.event, pending.properties);
  }
}

function disableAfterIdentityMutationFailure(client: typeof posthog): void {
  try {
    client.reset();
  } catch {
    // The reconciling marker forces another reset on the next safe document boot.
  }
  documentDisabled = true;
  identityReady = false;
  pendingEvents = [];
}

function reconcile(targetUserId: string | null, generation: number): boolean {
  const client = getClient();
  if (!client || documentDisabled) return false;

  identityReady = false;
  const marker = readMarker();
  if (marker === 'unavailable') {
    documentDisabled = true;
    pendingEvents = [];
    return false;
  }

  if (marker === 'unsafe') {
    if (!writeReconcilingMarker()) {
      documentDisabled = true;
      pendingEvents = [];
      return false;
    }
    try {
      client.reset();
      if (targetUserId !== null) client.identify(targetUserId, {}, {});
    } catch {
      disableAfterIdentityMutationFailure(client);
      return false;
    }
    if (!commitMarker(targetUserId)) {
      disableAfterCommitFailure(client, targetUserId);
      return false;
    }
    markIdentityReady(client, generation);
    return true;
  }

  if (marker === 'anonymous' && targetUserId === null) {
    markIdentityReady(client, generation);
    return true;
  }

  if (marker !== 'anonymous' && marker.state === 'identified' && marker.userId === targetUserId) {
    markIdentityReady(client, generation);
    return true;
  }

  if (!writeReconcilingMarker()) {
    documentDisabled = true;
    pendingEvents = [];
    return false;
  }

  try {
    if (marker !== 'anonymous') client.reset();
    if (targetUserId !== null) client.identify(targetUserId, {}, {});
  } catch {
    disableAfterIdentityMutationFailure(client);
    return false;
  }

  if (!commitMarker(targetUserId)) {
    disableAfterCommitFailure(client, targetUserId);
    return false;
  }

  markIdentityReady(client, generation);
  return true;
}

export function reconcilePersistedIdentity(settledUserId: string | null): Promise<boolean> {
  if (!getClient() || documentDisabled || identityEnding) return Promise.resolve(false);
  if (reconciliationInFlight?.targetUserId === settledUserId) {
    return reconciliationInFlight.promise;
  }

  const generation = ++reconciliationGeneration;
  identityReady = false;
  const previous = reconciliationInFlight?.promise ?? Promise.resolve(true);
  const operation: { targetUserId: string | null; promise: Promise<boolean> } = {
    targetUserId: settledUserId,
    promise: Promise.resolve(false),
  };
  operation.promise = previous
    .catch(() => false)
    .then(() => reconcile(settledUserId, generation))
    .catch(() => false)
    .finally(() => {
      if (reconciliationInFlight === operation) reconciliationInFlight = null;
    });
  reconciliationInFlight = operation;
  return operation.promise;
}

export function beginIdentityEnding(): void {
  identityEnding = true;
  identityReady = false;
  reconciliationGeneration += 1;
  pendingEvents = [];
}

export async function finishIdentityEnding(settledUserId: string | null): Promise<boolean> {
  identityEnding = false;
  return reconcilePersistedIdentity(settledUserId);
}

export function capture<TEvent extends AnalyticsEventName>(
  event: TEvent,
  input: AnalyticsEventInput[TEvent],
): boolean {
  const client = getClient();
  const environment = getAnalyticsEnvironment();
  if (!client || documentDisabled || !environment) return false;

  const properties: AnalyticsEventProperties<TEvent> = {
    ...input,
    schema_version: 1,
    environment,
    surface: getAnalyticsSurface(),
  };
  if (!validateAnalyticsEventProperties(event, properties)) return false;

  if (identityEnding) return false;
  if (!identityReady) {
    if (pendingEvents.length >= MAX_PENDING_EVENTS) pendingEvents.shift();
    pendingEvents.push({ event, properties });
    return true;
  }

  return sendEvent(client, event, properties);
}
