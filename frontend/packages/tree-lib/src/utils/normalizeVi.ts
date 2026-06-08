// eslint-disable-next-line no-misleading-character-class
const COMBINING_MARKS = /[̀-ͯ]/g

export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
}
