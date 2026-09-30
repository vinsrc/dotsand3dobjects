export interface ZipFileEntry {
  readonly fileName: string;
  readonly content: Uint8Array;
}