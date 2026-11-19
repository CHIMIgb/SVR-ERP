import { render, screen } from '@testing-library/react';
import { Portal } from './Portal';

describe('Portal', () => {
  it('renderiza a los hijos en el body del documento', () => {
    render(
      <Portal>
        <span>contenido del portal</span>
      </Portal>,
    );

    expect(screen.getByText('contenido del portal')).toBeInTheDocument();
  });
});
