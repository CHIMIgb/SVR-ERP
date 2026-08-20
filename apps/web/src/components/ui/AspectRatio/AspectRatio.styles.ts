export const aspectRatioClasses = {
  base: 'relative w-full overflow-hidden',
};

export type AspectRatioValue =
  | number
  | 'square'
  | 'video'
  | 'wide'
  | 'ultrawide'
  | 'portrait'
  | 'photo'
  | 'cinema';

export function ratioToString(ratio: AspectRatioValue): string {
  if (typeof ratio === 'number') {
    return ratio.toString();
  }

  const presets: Record<Exclude<AspectRatioValue, number>, string> = {
    square: '1 / 1',
    video: '16 / 9',
    wide: '21 / 9',
    ultrawide: '32 / 9',
    portrait: '3 / 4',
    photo: '4 / 3',
    cinema: '2.39 / 1',
  };

  return presets[ratio];
}
