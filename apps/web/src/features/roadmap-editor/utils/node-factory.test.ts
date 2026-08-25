import { afterEach, describe, expect, it } from 'vitest';

import { EDITOR_MESSAGES } from '@/constants/messages';

import {
  createId,
  createJagalchiNode,
  createJagalchiSection,
  createJagalchiText,
} from './node-factory';

describe('createId', () => {
  const originalRandomUUID = globalThis.crypto?.randomUUID;

  afterEach(() => {
    if (globalThis.crypto) {
      if (originalRandomUUID) {
        globalThis.crypto.randomUUID = originalRandomUUID;
      }
    }
  });

  it('returns UUID format when crypto.randomUUID exists', () => {
    const id = createId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns tmp- prefixed string when crypto.randomUUID is unavailable', () => {
    (globalThis.crypto as unknown as Record<string, unknown>).randomUUID = undefined;

    const id = createId();
    expect(id).toMatch(/^tmp-\d+-[0-9a-f]+$/);
  });
});

describe('createJagalchiNode', () => {
  it('creates a node with default values', () => {
    const node = createJagalchiNode({ position: { x: 10, y: 20 } });

    expect(node.type).toBe('jagalchi-node');
    expect(node.position).toEqual({ x: 10, y: 20 });
    expect(node.data.variant).toBe('white');
    expect(node.data.label).toBe(EDITOR_MESSAGES.FLOW_NODE_DEFAULT_LABEL);
    expect(node.data.description).toBe('');
    expect(node.data.resources).toEqual([]);
    expect(node.data.isLocked).toBe(false);
  });

  it('accepts custom variant and label', () => {
    const node = createJagalchiNode({
      position: { x: 0, y: 0 },
      variant: 'blue',
      label: 'Custom Label',
    });

    expect(node.data.variant).toBe('blue');
    expect(node.data.label).toBe('Custom Label');
  });

  it('generates a unique id', () => {
    const a = createJagalchiNode({ position: { x: 0, y: 0 } });
    const b = createJagalchiNode({ position: { x: 0, y: 0 } });
    expect(a.id).not.toBe(b.id);
  });
});

describe('createJagalchiSection', () => {
  it('creates a section with default values and style', () => {
    const section = createJagalchiSection({ position: { x: 5, y: 15 } });

    expect(section.type).toBe('jagalchi-section');
    expect(section.position).toEqual({ x: 5, y: 15 });
    expect(section.data.variant).toBe('white');
    expect(section.data.title).toBe(EDITOR_MESSAGES.FLOW_SECTION_DEFAULT_TITLE);
    expect(section.data.isLocked).toBe(false);
    expect(section.style).toEqual({ width: 200, height: 200 });
  });

  it('accepts custom variant and title', () => {
    const section = createJagalchiSection({
      position: { x: 0, y: 0 },
      variant: 'purple',
      title: 'My Section',
    });

    expect(section.data.variant).toBe('purple');
    expect(section.data.title).toBe('My Section');
  });

  it('generates a unique id', () => {
    const a = createJagalchiSection({ position: { x: 0, y: 0 } });
    const b = createJagalchiSection({ position: { x: 0, y: 0 } });
    expect(a.id).not.toBe(b.id);
  });
});

describe('createJagalchiText', () => {
  it('creates a text node with default values including fontSize and fontWeight', () => {
    const text = createJagalchiText({ position: { x: 30, y: 40 } });

    expect(text.type).toBe('jagalchi-text');
    expect(text.position).toEqual({ x: 30, y: 40 });
    expect(text.data.variant).toBe('white');
    expect(text.data.content).toBe(EDITOR_MESSAGES.FLOW_TEXT_DEFAULT_CONTENT);
    expect(text.data.fontSize).toBe(14);
    expect(text.data.fontWeight).toBe('normal');
    expect(text.data.isLocked).toBe(false);
  });

  it('accepts custom variant and content', () => {
    const text = createJagalchiText({
      position: { x: 0, y: 0 },
      variant: 'red',
      content: 'Hello World',
    });

    expect(text.data.variant).toBe('red');
    expect(text.data.content).toBe('Hello World');
  });

  it('generates a unique id', () => {
    const a = createJagalchiText({ position: { x: 0, y: 0 } });
    const b = createJagalchiText({ position: { x: 0, y: 0 } });
    expect(a.id).not.toBe(b.id);
  });
});
