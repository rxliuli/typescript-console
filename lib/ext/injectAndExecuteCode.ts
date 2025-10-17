export async function injectAndExecuteCode(code: string) {
  return new Promise<void>((resolve, reject) => {
    // TODO: not working with Safari
    browser.devtools.inspectedWindow.eval(
      code,
      (_result: any, isException: any) => {
        if (isException) {
          reject(new Error(isException.value || 'Evaluation failed'))
        } else {
          resolve()
        }
      }
    )
  })
}
