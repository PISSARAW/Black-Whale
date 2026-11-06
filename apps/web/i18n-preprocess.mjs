import { parse } from 'svelte/compiler'
import MagicString from 'magic-string'

const visibleAttributes = new Set([
  'title',
  'alt',
  'placeholder',
  'aria-label',
  'aria-description',
  'aria-valuetext',
])
const translate = (expression) =>
  `__publicText(${expression}, $__contentLocale, $__contentPage.data.localizedContent)`
const ignoredNode = (node) =>
  !node ||
  typeof node !== 'object' ||
  node.type === 'Comment' ||
  (node.type === 'RegularElement' && ['script', 'style'].includes(node.name))

/** Localize text at the rendering boundary, including SVG labels and accessible names. */
export function publicTextPreprocess() {
  return {
    name: 'public-text-localization',
    markup({ content, filename }) {
      if (!filename?.includes('/src/') || filename.includes('/node_modules/')) return
      const ast = parse(content, { modern: true })
      const edits = []
      const wrap = (node) => {
        if (node.type === 'Text' && /[A-Za-zÀ-ÿ]/.test(node.data)) {
          edits.push({
            start: node.start,
            end: node.end,
            text: `{${translate(JSON.stringify(node.data))}}`,
          })
        } else if (node.type === 'ExpressionTag') {
          const expression = content.slice(node.expression.start, node.expression.end)
          edits.push({ start: node.start, end: node.end, text: `{${translate(expression)}}` })
        }
      }
      const attribute = (node) => {
        if (!visibleAttributes.has(node.name) && node.name !== 'content') return
        if (!Array.isArray(node.value) || !node.value.length) return
        const expressions = node.value.map((value) =>
          value.type === 'Text'
            ? JSON.stringify(value.data)
            : content.slice(value.expression.start, value.expression.end),
        )
        const expression =
          expressions.length === 1 ? expressions[0] : `[${expressions.join(',')}].join('')`
        edits.push({
          start: node.start,
          end: node.end,
          text: `${node.name}={${translate(expression)}}`,
        })
      }
      const visit = (node) => {
        if (ignoredNode(node)) return
        if (['Text', 'ExpressionTag'].includes(node.type)) return wrap(node)
        if (node.type === 'Attribute') return attribute(node)
        for (const [key, value] of Object.entries(node)) {
          if (['expression', 'test', 'context', 'metadata'].includes(key)) continue
          if (Array.isArray(value)) value.forEach(visit)
          else visit(value)
        }
      }
      visit(ast.fragment)
      if (!edits.length) return
      const imports = `\nimport { locale as __contentLocale } from '$lib/i18n';\nimport { page as __contentPage } from '$app/stores';\nimport { publicText as __publicText } from '$lib/i18n/publicText';\n`
      const insertAt = ast.instance?.content.start ?? 0
      edits.push({
        start: insertAt,
        end: insertAt,
        text: ast.instance ? imports : `<script>${imports}</script>\n`,
      })
      const code = new MagicString(content)
      for (const edit of edits) {
        if (edit.start === edit.end) code.appendLeft(edit.start, edit.text)
        else code.overwrite(edit.start, edit.end, edit.text)
      }
      return { code: code.toString(), map: code.generateMap({ source: filename, hires: true }) }
    },
  }
}
