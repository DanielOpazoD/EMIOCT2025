import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generateUniqueId, resetUniqueIdCounters } from '../../scripts/utils/id.js';

describe('generateUniqueId', () => {
  let randomSpy;

  beforeEach(() => {
    resetUniqueIdCounters();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    randomSpy.mockRestore();
    vi.useRealTimers();
  });

  it('normaliza el prefijo y genera un identificador reproducible', () => {
    const id = generateUniqueId(' Nota Especial ');
    expect(id).toMatch(/^Nota-Especial-1704067200000-([a-z0-9]{6})-1$/);
  });

  it('incrementa un contador independiente por prefijo', () => {
    const first = generateUniqueId('tema');
    const second = generateUniqueId('tema');
    const other = generateUniqueId('otra-cosa');

    expect(first).not.toEqual(second);
    expect(first.split('-').pop()).toBe('1');
    expect(second.split('-').pop()).toBe('2');
    expect(other.split('-').pop()).toBe('1');
  });
});
