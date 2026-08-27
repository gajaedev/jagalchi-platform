import { describe, expect, it } from 'vitest';

import {
  PAGE_KEYS,
  getPageKey,
  isAnalyticsEnvironment,
  isAnalyticsEventName,
  validateAnalyticsEventProperties,
} from './events';

const common = {
  schema_version: 1 as const,
  environment: 'staging' as const,
  surface: 'web' as const,
};

describe('analytics event contract', () => {
  it('maps only the four exact pathname values', () => {
    expect(PAGE_KEYS).toEqual({
      '/': 'home',
      '/register': 'register',
      '/login': 'login',
      '/career': 'career',
    });
    expect(getPageKey('/')).toBe('home');
    expect(getPageKey('/auth/callback')).toBeNull();
    expect(getPageKey('/career/123')).toBeNull();
    expect(getPageKey('/career/')).toBeNull();
    expect(getPageKey('/career?token=secret')).toBeNull();
  });

  it('accepts only the four environments and bounded event names', () => {
    for (const environment of ['production', 'staging', 'preview', 'development']) {
      expect(isAnalyticsEnvironment(environment)).toBe(true);
    }
    expect(isAnalyticsEnvironment('test')).toBe(false);
    expect(isAnalyticsEnvironment(undefined)).toBe(false);

    const names = [
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
    ];
    names.forEach((name) => expect(isAnalyticsEventName(name)).toBe(true));
    expect(isAnalyticsEventName('$pageview')).toBe(false);
  });

  it('requires the exact page and auth schema', () => {
    expect(
      validateAnalyticsEventProperties('page_viewed', {
        ...common,
        page_key: 'career',
        auth_state: 'authenticated',
      }),
    ).toBe(true);
    expect(
      validateAnalyticsEventProperties('page_viewed', {
        ...common,
        page_key: 'career',
        auth_state: 'authenticated',
        path: '/career',
      }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('page_viewed', {
        ...common,
        page_key: 'unknown',
        auth_state: 'authenticated',
      }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('page_viewed', {
        ...common,
        page_key: 'career',
        auth_state: 'pending',
      }),
    ).toBe(false);
  });

  it('validates every bounded day-one event property and rejects extras', () => {
    expect(validateAnalyticsEventProperties('signup_started', { ...common, method: 'email' })).toBe(
      true,
    );
    expect(
      validateAnalyticsEventProperties('signup_completed', {
        ...common,
        method: 'email',
        links_count_bucket: '3',
      }),
    ).toBe(true);
    expect(
      validateAnalyticsEventProperties('login_completed', { ...common, method: 'email' }),
    ).toBe(true);
    expect(validateAnalyticsEventProperties('oauth_completed', common)).toBe(true);
    expect(
      validateAnalyticsEventProperties('career_target_created', {
        ...common,
        competency_count_bucket: '4+',
        has_posting_url: true,
        requirements_length_bucket: '5000-20000',
      }),
    ).toBe(true);
    expect(
      validateAnalyticsEventProperties('career_evidence_submitted', {
        ...common,
        evidence_kind: 'GITHUB_PULL_REQUEST',
        competency_count_bucket: '2-3',
        has_description: false,
      }),
    ).toBe(true);
    expect(
      validateAnalyticsEventProperties('recommendation_list_viewed', {
        ...common,
        source: 'explore',
        result_count_bucket: '4+',
      }),
    ).toBe(true);
    expect(
      validateAnalyticsEventProperties('recommendation_selected', {
        ...common,
        source: 'home',
      }),
    ).toBe(true);
    expect(validateAnalyticsEventProperties('roadmap_viewed', common)).toBe(true);
    expect(
      validateAnalyticsEventProperties('learning_node_opened', {
        ...common,
        completion_state: 'incomplete',
      }),
    ).toBe(true);
    expect(validateAnalyticsEventProperties('learning_resource_opened', common)).toBe(true);
    expect(
      validateAnalyticsEventProperties('learning_node_completion_changed', {
        ...common,
        action: 'completed',
      }),
    ).toBe(true);
    expect(
      validateAnalyticsEventProperties('signup_completed', {
        ...common,
        method: 'email',
        links_count_bucket: '4',
      }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('career_target_created', {
        ...common,
        competency_count_bucket: '0',
        has_posting_url: true,
        requirements_length_bucket: '20-499',
      }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('oauth_completed', { ...common, provider: 'github' }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('login_completed', { ...common, method: 'oauth' }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('login_completed', {
        ...common,
        method: 'email',
        email: 'person@example.com',
      }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('recommendation_list_viewed', {
        ...common,
        source: 'unknown',
        result_count_bucket: '4+',
      }),
    ).toBe(false);
    expect(
      validateAnalyticsEventProperties('learning_node_completion_changed', {
        ...common,
        action: 'started',
      }),
    ).toBe(false);
  });
});
