import { describe, expect, it } from 'vitest'
import { darkChartConfig } from '../src/utils/chartTheme'

describe('dark chart chrome', () => {
  it('leaves the marks of the author alone and repaints the chrome', () => {
    const spec = { config: { mark: { color: '#e45756' } }, marks: [{ type: 'bar', color: '#4c78a8' }] }
    const config = darkChartConfig(spec.config)
    expect(config.mark).toEqual({ color: '#e45756' }, 'la couleur des marques reste celle de l auteur')
    expect(spec.marks).toEqual([{ type: 'bar', color: '#4c78a8' }])
    expect(config.background).toBe('transparent')
    expect(config.axis.labelColor).toBe('#dfe4ed')
    expect(config.axis.titleColor).toBe('#dfe4ed')
    expect(config.legend.labelColor).toBe('#dfe4ed')
    expect(config.title.color).toBe('#dfe4ed')
    expect(config.text.fill).toBe('#dfe4ed')
    expect(config.view.stroke).toBe(null)
  })

  it('keeps an explicit value written in the spec', () => {
    const config = darkChartConfig({
      axis: { labelColor: '#ff0000', grid: false },
      title: { color: '#00ff00' },
      legend: { labelColor: '#0000ff' },
      text: { fill: '#123456' },
      view: { stroke: '#abcdef' },
    })
    expect(config.axis.labelColor).toBe('#ff0000')
    expect(config.axis.grid).toBe(false)
    expect(config.axis.titleColor).toBe('#dfe4ed', 'les cles non surchargees prennent le theme')
    expect(config.title.color).toBe('#00ff00')
    expect(config.legend.labelColor).toBe('#0000ff')
    expect(config.text.fill).toBe('#123456')
    expect(config.view.stroke).toBe('#abcdef')
  })

  it('works with no config at all', () => {
    for (const empty of [undefined, null, {}]) {
      const config = darkChartConfig(empty)
      expect(config.axis.labelColor).toBe('#dfe4ed')
      expect(config.background).toBe('transparent')
    }
  })

  it('does not mutate the object it is given', () => {
    const original = { axis: { labelColor: '#000' } }
    darkChartConfig(original)
    expect(original.axis).toEqual({ labelColor: '#000' })
    expect(original.background).toBeUndefined()
  })
})
