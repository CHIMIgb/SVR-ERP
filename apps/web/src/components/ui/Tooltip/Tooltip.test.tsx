import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('asocia el tooltip visible con su disparador mediante un id único', () => {
    const { container } = render(
      <>
        <Tooltip content="Primer ayuda"><button>Tipo A</button></Tooltip>
        <Tooltip content="Segunda ayuda"><button>Tipo B</button></Tooltip>
      </>,
    );

    const disparadores = container.querySelectorAll('div.relative');
    fireEvent.mouseEnter(disparadores[0]);
    fireEvent.mouseEnter(disparadores[1]);
    act(() => jest.advanceTimersByTime(300));

    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips).toHaveLength(2);
    expect(new Set(tooltips.map((t) => t.id)).size).toBe(2);
    expect(disparadores[0]).toHaveAttribute('aria-describedby', tooltips[0].id);
  });

  it('oculta el tooltip al salir del disparador', () => {
    const { container } = render(
      <Tooltip content="Ayuda"><button>Tipo A</button></Tooltip>,
    );

    const disparador = container.querySelector('div.relative')!;
    fireEvent.mouseEnter(disparador);
    act(() => jest.advanceTimersByTime(300));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(disparador);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
