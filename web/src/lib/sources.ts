export const SOURCE_OPTIONS = [
  { value: 'douban', label: '豆瓣 (Douban)' },
  { value: 'imdb', label: 'IMDb' },
  { value: 'bangumi', label: 'Bangumi' },
  { value: 'tmdb', label: 'TMDB' },
  { value: 'steam', label: 'Steam' },
  { value: 'gog', label: 'GOG' },
] as const;

export type SourceId = (typeof SOURCE_OPTIONS)[number]['value'];
