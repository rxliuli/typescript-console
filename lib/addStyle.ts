export function addStyle(shadow: ShadowRoot, styles: string[]) {
  const sheets = styles.map((style) => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(style.replaceAll(':root', ':host'))
    return sheet
  })
  shadow.adoptedStyleSheets = sheets
}
