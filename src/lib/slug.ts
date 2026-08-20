const DIACRITIC_RANGE_START = 0x0300;
const DIACRITIC_RANGE_END = 0x036f;

function stripDiacritics(value: string): string {
  return Array.from(value.normalize('NFD'))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < DIACRITIC_RANGE_START || code > DIACRITIC_RANGE_END;
    })
    .join('');
}

export function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function generateChampionshipSlug(name: string): string {
  const base = slugify(name) || 'campeonato';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
