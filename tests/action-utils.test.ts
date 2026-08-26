import { describe, expect, it } from 'vitest';
import { getActionErrorMessage, stringFormValue } from '../src/lib/action-utils';

describe('server action input helpers', () => {
  it('does not expose arbitrary thrown values as public errors', () => {
    expect(getActionErrorMessage(new Error('known'), 'fallback')).toBe('known');
    expect(getActionErrorMessage({ message: 'untrusted object' }, 'fallback')).toBe('fallback');
  });

  it('accepts only string FormData values', () => {
    const data = new FormData();
    data.set('name', ' Liga ');
    data.set('file', new File(['x'], 'x.txt'));
    expect(stringFormValue(data, 'name')).toBe(' Liga ');
    expect(stringFormValue(data, 'file')).toBeUndefined();
  });
});
