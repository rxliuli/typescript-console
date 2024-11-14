import { expect, it } from 'vitest'
import { location } from 'vfile-location'

it('postionToOffset', () => {
  expect(location('const a = 1').toOffset({ line: 1, column: 1 })).eq(0)
  expect(location('const a = 1').toOffset({ line: 1, column: 2 })).eq(1)
  expect(
    location('const a = 1\nconst b = 2').toOffset({ line: 2, column: 1 }),
  ).eq(12)
})

it('offsetToPosition', () => {
  expect(location('const a = 1').toPoint(0)).toEqual({
    line: 1,
    column: 1,
    offset: 0,
  })
  expect(location('const a = 1\nconst b = 2').toPoint(1)).toEqual({
    line: 1,
    column: 2,
    offset: 1,
  })
  expect(location('const a = 1\nconst b = 2').toPoint(12)).toEqual({
    line: 2,
    column: 1,
    offset: 12,
  })
})
