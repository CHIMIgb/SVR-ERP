import { fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function Lanzador() {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast('Guardado correctamente', 'success', { duration: 0 })}>
      Mostrar aviso
    </button>
  );
}

describe('Toast', () => {
  it('muestra el mensaje y lo quita al cerrar', () => {
    render(
      <ToastProvider>
        <Lanzador />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar aviso' }));
    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText('Guardado correctamente')).not.toBeInTheDocument();
  });
});
