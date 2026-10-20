import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDateTime, formatDuration } from './format';

describe('formatos colombianos', () => {
  it('formatea valores en pesos colombianos', () => {
    expect(formatCurrency(185000)).toMatch(/185[.\s]000/);
  });

  it('permite mostrar la moneda extraída del comprobante', () => {
    expect(formatCurrency(25, 'USD')).toContain('US$');
  });

  it('usa un guion cuando no existe fecha', () => {
    expect(formatDateTime('')).toBe('—');
  });
});

describe('duraciones de los indicadores', () => {
  it('usa minutos, horas o días según el tamaño', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0.25)).toBe('15 min');
    expect(formatDuration(6)).toBe('6 h');
    expect(formatDuration(36)).toBe('36 h');
    expect(formatDuration(60)).toBe('2,5 días');
  });
});
