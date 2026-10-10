declare module 'html2bbcode' {
  export default class HTML2BBCode {
    constructor(options?: unknown);
    feed(html: string): { toString(): string };
  }
}
