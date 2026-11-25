import { render, screen } from '@testing-library/react';
import { AvisoSinConexion } from './AvisoSinConexion';

describe('AvisoSinConexion', () => {
  it('no se muestra si la pantalla no está sirviendo la copia guardada', () => {
    const { container } = render(<AvisoSinConexion sirviendoSnapshot={false} fechaDatos="2026-11-24T05:43:00.000Z" />);
    expect(container).toBeEmptyDOMElement();
  });

  // La hora en es-MX termina en "a.m."/"p.m.": antes salía "11:43 p.m.. La sincronización…".
  // En cualquier zona del runner la hora sale con "a.m." o "p.m.", que es lo que provocaba el doble punto.
  it.each(['2026-11-24T23:43:00.000Z', '2026-11-24T14:05:00.000Z'])('con fecha %s no repite el punto', (iso) => {
    render(<AvisoSinConexion sirviendoSnapshot fechaDatos={iso} />);
    const texto = screen.getByRole('status').textContent ?? '';
    expect(texto).not.toContain('..');
    expect(texto).toMatch(/m\. La sincronización continúa al volver la señal\.$/);
  });

  it('sin fecha conocida cierra la oración con un solo punto', () => {
    render(<AvisoSinConexion sirviendoSnapshot fechaDatos={null} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sin conexión — mostrando los datos guardados. La sincronización continúa al volver la señal.',
    );
  });
});
