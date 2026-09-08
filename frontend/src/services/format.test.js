import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDateTime } from './format';

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
