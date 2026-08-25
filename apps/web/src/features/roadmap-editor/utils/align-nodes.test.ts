import { describe, expect, it } from 'vitest';

import type { RoadmapNode } from '../types/editor.types';

import { alignNodes, type AlignDirection } from './align-nodes';

function createNode(
  id: string,
  x: number,
  y: number,
  width?: number,
  height?: number,
): RoadmapNode {
  return {
    id,
    type: 'jagalchi-node',
    position: { x, y },
    data: {
      variant: 'white',
      label: 'test',
      description: '',
      resources: [],
      isLocked: false,
    },
    ...(width !== undefined || height !== undefined ? { measured: { width, height } } : {}),
  } as RoadmapNode;
}

describe('alignNodes', () => {
  describe('early return', () => {
    it('returns original array when selectedIds is empty', () => {
      const nodes = [createNode('a', 10, 20)];
      const result = alignNodes(nodes, [], 'left');
      expect(result).toBe(nodes);
    });

    it('returns original array when selectedIds has only 1 element', () => {
      const nodes = [createNode('a', 10, 20)];
      const result = alignNodes(nodes, ['a'], 'left');
      expect(result).toBe(nodes);
    });
  });

  describe('non-selected nodes remain unchanged', () => {
    const directions: AlignDirection[] = ['left', 'right', 'center', 'top', 'bottom', 'middle'];

    it.each(directions)('direction "%s": non-selected node keeps original position', (dir) => {
      const nodes = [
        createNode('a', 10, 20, 100, 50),
        createNode('b', 50, 80, 120, 60),
        createNode('c', 200, 300, 80, 40),
      ];
      const result = alignNodes(nodes, ['a', 'b'], dir);
      const nonSelected = result.find((n) => n.id === 'c');
      expect(nonSelected?.position).toEqual({ x: 200, y: 300 });
    });
  });

  describe('left alignment', () => {
    it('aligns selected nodes to the minimum x', () => {
      const nodes = [
        createNode('a', 10, 0, 100, 50),
        createNode('b', 50, 0, 120, 60),
        createNode('c', 30, 0, 80, 40),
      ];
      const result = alignNodes(nodes, ['a', 'b', 'c'], 'left');

      expect(result[0].position.x).toBe(10);
      expect(result[1].position.x).toBe(10);
      expect(result[2].position.x).toBe(10);
    });
  });

  describe('right alignment', () => {
    it('aligns selected nodes so their right edges match the maximum right edge', () => {
      const nodes = [createNode('a', 10, 0, 100, 50), createNode('b', 50, 0, 120, 60)];
      // right edges: a=10+100=110, b=50+120=170
      // maxRight = 170
      const result = alignNodes(nodes, ['a', 'b'], 'right');

      expect(result[0].position.x).toBe(170 - 100); // 70
      expect(result[1].position.x).toBe(170 - 120); // 50
    });
  });

  describe('center alignment', () => {
    it('aligns selected nodes to the horizontal center', () => {
      const nodes = [createNode('a', 0, 0, 100, 50), createNode('b', 200, 0, 100, 50)];
      // minX=0, maxX=200+100=300, centerX=150
      const result = alignNodes(nodes, ['a', 'b'], 'center');

      expect(result[0].position.x).toBe(150 - 50); // 100
      expect(result[1].position.x).toBe(150 - 50); // 100
    });
  });

  describe('top alignment', () => {
    it('aligns selected nodes to the minimum y', () => {
      const nodes = [
        createNode('a', 0, 30, 100, 50),
        createNode('b', 0, 10, 120, 60),
        createNode('c', 0, 50, 80, 40),
      ];
      const result = alignNodes(nodes, ['a', 'b', 'c'], 'top');

      expect(result[0].position.y).toBe(10);
      expect(result[1].position.y).toBe(10);
      expect(result[2].position.y).toBe(10);
    });
  });

  describe('bottom alignment', () => {
    it('aligns selected nodes so their bottom edges match the maximum bottom edge', () => {
      const nodes = [createNode('a', 0, 10, 100, 50), createNode('b', 0, 50, 120, 80)];
      // bottom edges: a=10+50=60, b=50+80=130
      // maxBottom = 130
      const result = alignNodes(nodes, ['a', 'b'], 'bottom');

      expect(result[0].position.y).toBe(130 - 50); // 80
      expect(result[1].position.y).toBe(130 - 80); // 50
    });
  });

  describe('middle alignment', () => {
    it('aligns selected nodes to the vertical center', () => {
      const nodes = [createNode('a', 0, 0, 100, 40), createNode('b', 0, 200, 100, 60)];
      // minY=0, maxY=200+60=260, centerY=130
      const result = alignNodes(nodes, ['a', 'b'], 'middle');

      expect(result[0].position.y).toBe(130 - 20); // 110
      expect(result[1].position.y).toBe(130 - 30); // 100
    });
  });

  describe('measured fallback to 0', () => {
    it('right alignment treats missing width as 0', () => {
      const nodes = [
        createNode('a', 10, 0), // no measured
        createNode('b', 50, 0, 120, 60),
      ];
      // right edges: a=10+0=10, b=50+120=170
      // maxRight = 170
      const result = alignNodes(nodes, ['a', 'b'], 'right');

      expect(result[0].position.x).toBe(170 - 0); // 170
      expect(result[1].position.x).toBe(170 - 120); // 50
    });

    it('center alignment treats missing width as 0', () => {
      const nodes = [
        createNode('a', 0, 0), // no measured
        createNode('b', 100, 0, 200, 50),
      ];
      // minX=0, maxX=100+200=300, centerX=150
      const result = alignNodes(nodes, ['a', 'b'], 'center');

      expect(result[0].position.x).toBe(150 - 0); // 150
      expect(result[1].position.x).toBe(150 - 100); // 50
    });

    it('bottom alignment treats missing height as 0', () => {
      const nodes = [
        createNode('a', 0, 10), // no measured
        createNode('b', 0, 50, 120, 80),
      ];
      // bottom edges: a=10+0=10, b=50+80=130
      // maxBottom = 130
      const result = alignNodes(nodes, ['a', 'b'], 'bottom');

      expect(result[0].position.y).toBe(130 - 0); // 130
      expect(result[1].position.y).toBe(130 - 80); // 50
    });

    it('middle alignment treats missing height as 0', () => {
      const nodes = [
        createNode('a', 0, 0), // no measured
        createNode('b', 0, 200, 100, 60),
      ];
      // minY=0, maxY=200+60=260, centerY=130
      const result = alignNodes(nodes, ['a', 'b'], 'middle');

      expect(result[0].position.y).toBe(130 - 0); // 130
      expect(result[1].position.y).toBe(130 - 30); // 100
    });
  });
});
