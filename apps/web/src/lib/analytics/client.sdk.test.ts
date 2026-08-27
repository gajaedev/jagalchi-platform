import { gunzipSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PostHog } from 'posthog-js';

const instances: PostHog[] = [];

afterEach(() => {
  for (const instance of instances.splice(0)) instance.reset();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pinned PostHog serialized wire canary', () => {
  it('sends only reconstructed app and identify fields through the real SDK transport', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const [{ PostHog }, { sanitizeWireEvent }] = await Promise.all([
      import('posthog-js'),
      import('./client'),
    ]);

    const instance = new PostHog();
    instances.push(instance);
    instance.init('synthetic-project-key', {
      api_host: 'https://us.i.posthog.com',
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
      before_send: sanitizeWireEvent,
    });

    instance.capture('page_viewed', {
      schema_version: 1,
      environment: 'staging',
      surface: 'web',
      page_key: 'register',
      auth_state: 'anonymous',
      email: 'canary@example.com',
      $current_url: 'https://example.test/register?code=oauth-secret',
    });
    instance.identify(
      'opaque-user-id',
      { email: 'person-secret@example.com' },
      {
        $initial_current_url: 'https://example.test/oauth#token-secret',
      },
    );

    await vi.waitFor(
      () => {
        const eventRequests = fetchMock.mock.calls.filter(([input]) =>
          String(input).includes('https://us.i.posthog.com/e/'),
        );
        expect(eventRequests).toHaveLength(2);
      },
      { timeout: 5_000 },
    );

    const requests = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('https://us.i.posthog.com/e/'),
    );
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual(
      requests.map(([input]) => String(input)),
    );
    const envelopes = await Promise.all(
      requests.map(async ([, init]) => {
        const body = init?.body;
        let bytes: Buffer;
        if (typeof body === 'string') {
          bytes = Buffer.from(body);
        } else if (body instanceof Blob) {
          bytes = Buffer.from(await body.arrayBuffer());
        } else if (body instanceof ArrayBuffer) {
          bytes = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          bytes = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else {
          throw new Error('PostHog request body was not serializable');
        }
        const jsonBytes = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
        return JSON.parse(jsonBytes.toString('utf8')) as Record<string, unknown>;
      }),
    );
    for (const envelope of envelopes) {
      expect(Object.keys(envelope).sort()).toEqual(['api_key', 'batch', 'sent_at']);
      expect(envelope.api_key).toBe('synthetic-project-key');
      expect(envelope.sent_at).toEqual(expect.any(String));
    }
    const payloads = envelopes.flatMap((envelope) =>
      Array.isArray(envelope.batch) ? (envelope.batch as Record<string, unknown>[]) : [],
    );
    expect(payloads.map(({ event }) => event).sort()).toEqual(['$identify', 'page_viewed']);
    const pageEvent = payloads.find(({ event }) => event === 'page_viewed');
    const identifyEvent = payloads.find(({ event }) => event === '$identify');
    expect(pageEvent).toBeDefined();
    expect(identifyEvent).toBeDefined();

    const commonTransportKeys = [
      'token',
      'distinct_id',
      '$device_id',
      '$session_id',
      '$window_id',
      '$lib',
      '$lib_version',
    ];
    expect(Object.keys(pageEvent ?? {}).sort()).toEqual(
      ['event', 'offset', 'properties', 'uuid'].sort(),
    );
    expect(Object.keys(identifyEvent ?? {}).sort()).toEqual(
      ['$set', '$set_once', 'event', 'properties', 'timestamp', 'uuid'].sort(),
    );
    expect(Object.keys(pageEvent?.properties as Record<string, unknown>).sort()).toEqual(
      [
        ...commonTransportKeys,
        'schema_version',
        'environment',
        'surface',
        'page_key',
        'auth_state',
      ].sort(),
    );
    expect(Object.keys(identifyEvent?.properties as Record<string, unknown>).sort()).toEqual(
      [...commonTransportKeys, '$anon_distinct_id'].sort(),
    );
    expect(identifyEvent?.$set).toEqual({});
    expect(identifyEvent?.$set_once).toEqual({});

    const serialized = JSON.stringify(payloads);
    for (const forbidden of [
      'canary@example.com',
      'person-secret@example.com',
      'oauth-secret',
      'token-secret',
      '$current_url',
      '$initial_current_url',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
