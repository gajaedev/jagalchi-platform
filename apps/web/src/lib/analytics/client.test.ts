import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const posthog = {
  capture: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  reset: vi.fn(),
};

vi.mock('posthog-js', () => ({ default: posthog }));

const transport = {
  token: 'project-token',
  distinct_id: 'anonymous-id',
  $device_id: 'device-id',
  $session_id: 'session-id',
  $window_id: 'window-id',
  $lib: 'web',
  $lib_version: '1.421.1',
};

async function loadClient() {
  vi.resetModules();
  return import('./client');
}

function enableAnalytics() {
  vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'project-token');
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com');
  vi.stubEnv('NEXT_PUBLIC_ENV', 'staging');
}

function wireEvent(
  event: string,
  properties: Record<string, unknown>,
  topLevel: Record<string, unknown> = {},
) {
  return {
    event,
    uuid: 'uuid',
    timestamp: new Date('2026-05-30T00:00:00.000Z'),
    properties: { ...transport, ...properties },
    ...topLevel,
  };
}

describe('analytics client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    enableAnalytics();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('does not initialize or capture when disabled, incomplete, or SSR', async () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'false');
    let client = await loadClient();
    expect(await client.reconcilePersistedIdentity(null)).toBe(false);
    expect(client.capture('oauth_completed', {})).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();

    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    client = await loadClient();
    expect(await client.reconcilePersistedIdentity(null)).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();

    vi.stubGlobal('window', undefined);
    client = await loadClient();
    expect(await client.reconcilePersistedIdentity(null)).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('pins every automatic PostHog feature off', async () => {
    const client = await loadClient();
    await client.reconcilePersistedIdentity(null);
    expect(posthog.init).toHaveBeenCalledWith(
      'project-token',
      expect.objectContaining({
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
        before_send: expect.any(Function),
      }),
    );
  });

  it('allows only reconstructed app and identity wire payloads', async () => {
    const { sanitizeWireEvent } = await loadClient();
    const page = sanitizeWireEvent(
      wireEvent('page_viewed', {
        schema_version: 1,
        environment: 'staging',
        surface: 'web',
        page_key: 'career',
        auth_state: 'anonymous',
        $current_url: 'https://app.example/career?code=secret',
        email: 'person@example.com',
      }),
    );
    expect(page).toEqual(
      wireEvent('page_viewed', {
        schema_version: 1,
        environment: 'staging',
        surface: 'web',
        page_key: 'career',
        auth_state: 'anonymous',
      }),
    );
    expect(JSON.stringify(page)).not.toContain('secret');
    expect(JSON.stringify(page)).not.toContain('person@example.com');
    expect(sanitizeWireEvent(wireEvent('$pageview', {}))).toBeNull();
    expect(
      sanitizeWireEvent(
        wireEvent('page_viewed', {
          schema_version: 1,
          environment: 'staging',
          surface: 'web',
          page_key: 'career',
          auth_state: 'anonymous',
        }),
      ),
    ).toEqual(
      wireEvent('page_viewed', {
        schema_version: 1,
        environment: 'staging',
        surface: 'web',
        page_key: 'career',
        auth_state: 'anonymous',
      }),
    );
    expect(
      sanitizeWireEvent(
        wireEvent('$identify', {
          $anon_distinct_id: 'anonymous-id',
          $current_url: 'https://app.example/auth/callback?code=secret',
        }),
      ),
    ).toEqual(
      wireEvent('$identify', { $anon_distinct_id: 'anonymous-id' }, { $set: {}, $set_once: {} }),
    );
    expect(
      sanitizeWireEvent(
        wireEvent(
          '$identify',
          {
            $anon_distinct_id: 'anonymous-id',
          },
          {
            $set: { email: 'secret@example.com' },
            $set_once: { $initial_current_url: 'https://secret' },
          },
        ),
      ),
    ).toEqual(
      wireEvent(
        '$identify',
        {
          $anon_distinct_id: 'anonymous-id',
        },
        { $set: {}, $set_once: {} },
      ),
    );
  });

  it('queues sanitized actions until identity reconciliation completes', async () => {
    const client = await loadClient();
    expect(client.capture('signup_started', { method: 'email' })).toBe(true);
    expect(posthog.capture).not.toHaveBeenCalled();

    expect(await client.reconcilePersistedIdentity(null)).toBe(true);
    expect(posthog.capture).toHaveBeenCalledWith('signup_started', {
      method: 'email',
      schema_version: 1,
      environment: 'staging',
      surface: 'web',
    });
  });

  it('reconciles stored A to anonymous before permitting capture', async () => {
    window.localStorage.setItem(
      'jagalchi:analytics-identity:v1',
      JSON.stringify({ version: 1, state: 'identified', userId: 'A' }),
    );
    const client = await loadClient();
    expect(await client.reconcilePersistedIdentity(null)).toBe(true);
    expect(posthog.reset).toHaveBeenCalledTimes(1);
    expect(posthog.identify).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('jagalchi:analytics-identity:v1')).toBeNull();
  });

  it('preserves stored A for A and resets B before identifying A', async () => {
    window.localStorage.setItem(
      'jagalchi:analytics-identity:v1',
      JSON.stringify({ version: 1, state: 'identified', userId: 'A' }),
    );
    let client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(true);
    expect(posthog.reset).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();

    vi.clearAllMocks();
    window.localStorage.setItem(
      'jagalchi:analytics-identity:v1',
      JSON.stringify({ version: 1, state: 'identified', userId: 'B' }),
    );
    client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(true);
    expect(posthog.reset).toHaveBeenCalledBefore(posthog.identify);
    expect(posthog.identify).toHaveBeenCalledWith('A', {}, {});
  });

  it('resets corrupt and reconciling markers before optional identification', async () => {
    for (const value of ['{broken', JSON.stringify({ version: 1, state: 'reconciling' })]) {
      vi.clearAllMocks();
      window.localStorage.setItem('jagalchi:analytics-identity:v1', value);
      const client = await loadClient();
      expect(await client.reconcilePersistedIdentity('A')).toBe(true);
      expect(posthog.reset).toHaveBeenCalledTimes(1);
      expect(posthog.identify).toHaveBeenCalledWith('A', {}, {});
    }
  });

  it('fails closed on marker, reset, identify, and commit failures', async () => {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    let client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(false);
    expect(posthog.identify).not.toHaveBeenCalled();

    vi.restoreAllMocks();
    posthog.reset.mockImplementationOnce(() => {
      throw new Error('reset failed');
    });
    window.localStorage.setItem(
      'jagalchi:analytics-identity:v1',
      JSON.stringify({ version: 1, state: 'identified', userId: 'B' }),
    );
    client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(false);
    expect(posthog.identify).not.toHaveBeenCalled();

    vi.clearAllMocks();
    posthog.identify.mockImplementationOnce(() => {
      throw new Error('identify failed');
    });
    client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(false);
    expect(client.capture('oauth_completed', {})).toBe(false);

    vi.restoreAllMocks();
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'jagalchi:analytics-identity:v1' && String(value).includes('identified'))
        throw new Error('commit failed');
      originalSetItem(key, value);
    });
    client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(false);
    expect(client.capture('oauth_completed', {})).toBe(false);
  });

  it('fails closed when persisted identity storage cannot be read', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    const client = await loadClient();
    expect(await client.reconcilePersistedIdentity('A')).toBe(false);
    expect(posthog.reset).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it('serializes different reconciliation targets and keeps capture locked while ending', async () => {
    const client = await loadClient();
    const first = client.reconcilePersistedIdentity(null);
    const second = client.reconcilePersistedIdentity('A');
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(posthog.identify).toHaveBeenCalledWith('A', {}, {});
    expect(window.localStorage.getItem('jagalchi:analytics-identity:v1')).toContain('"userId":"A"');

    client.beginIdentityEnding();
    expect(client.capture('oauth_completed', {})).toBe(false);
    await expect(client.finishIdentityEnding(null)).resolves.toBe(true);
    expect(client.capture('oauth_completed', {})).toBe(true);
  });

  it('deduplicates concurrent reconciliation', async () => {
    const client = await loadClient();
    const [first, second] = await Promise.all([
      client.reconcilePersistedIdentity('A'),
      client.reconcilePersistedIdentity('A'),
    ]);
    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(posthog.identify).toHaveBeenCalledTimes(1);
  });
});
