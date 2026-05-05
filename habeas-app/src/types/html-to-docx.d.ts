declare module "html-to-docx" {
  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString: string | null,
    documentOptions?: Record<string, unknown>,
    footerHTMLString?: string | null
  ): Promise<Buffer | Blob>;
  export default HTMLtoDOCX;
}
