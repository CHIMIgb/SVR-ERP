import { neutralizarFormula, escapeCsv } from './csv';

describe('neutralizarFormula', () => {
  it('antepone apostrofo a cadenas con prefijo de formula (CWE-1236)', () => {
    expect(neutralizarFormula('=HYPERLINK("http://evil.com","clic")')).toBe(
      `'=HYPERLINK("http://evil.com","clic")`,
    );
    expect(neutralizarFormula('=1+1')).toBe(`'=1+1`);
    expect(neutralizarFormula('@SUM(A1:A2)')).toBe(`'@SUM(A1:A2)`);
    expect(neutralizarFormula('+1400')).toBe(`'+1400`);
  });

  it('NO neutraliza numeros (incluidos negativos) ni cadenas seguras', () => {
    expect(neutralizarFormula(-350)).toBe('-350');
    expect(neutralizarFormula(4000)).toBe('4000');
    expect(neutralizarFormula('FAC-2026-0001')).toBe('FAC-2026-0001');
    expect(neutralizarFormula('')).toBe('');
    expect(neutralizarFormula(null)).toBe('');
    expect(neutralizarFormula(undefined)).toBe('');
  });
});

describe('escapeCsv', () => {
  it('entrecomilla solo con "," "\\n" "\\r" (RFC 4180) y preserva cifras', () => {
    expect(escapeCsv('FAC-2026-0001')).toBe('FAC-2026-0001');
    expect(escapeCsv(4000.5)).toBe('4000.5');
    expect(escapeCsv('cliente, con, coma')).toBe('"cliente, con, coma"');
    expect(escapeCsv('con "comillas"')).toBe('"con ""comillas"""');
  });
});
