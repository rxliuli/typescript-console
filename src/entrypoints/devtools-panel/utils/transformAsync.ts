import { expose } from 'comlink'
import { isWebWorker } from './isWebWorker'
import MagicString from 'magic-string'
;import { fromObject } from 'convert-source-map';
`
;(async ()=>{

})()
`

export async function transformAsync(code: string) {
  const s = new MagicString(code)
  s.prepend(';(async ()=>{\n').append('\n})()')
  const map = s.generateMap({
    source: 'example.tsx',
    includeContent: true,
  })
  const inlineSourceMap = fromObject(map).toComment()
  return s.toString() + '\n' + inlineSourceMap
}

if (isWebWorker()) {
  expose(transformAsync)
}
