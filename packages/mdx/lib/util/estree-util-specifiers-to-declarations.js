/**
 * @typedef {import('estree-jsx').ExportSpecifier} ExportSpecifier
 * @typedef {import('estree-jsx').Expression} Expression
 * @typedef {import('estree-jsx').Identifier} Identifier
 * @typedef {import('estree-jsx').ImportSpecifier} ImportSpecifier
 * @typedef {import('estree-jsx').ImportDefaultSpecifier} ImportDefaultSpecifier
 * @typedef {import('estree-jsx').ImportNamespaceSpecifier} ImportNamespaceSpecifier
 * @typedef {import('estree-jsx').VariableDeclarator} VariableDeclarator
 */

import {create} from './estree-util-create.js'

/**
 * @param {Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ExportSpecifier>} specifiers
 * @param {Expression} init
 * @returns {Array<VariableDeclarator>}
 */
export function specifiersToDeclarations(specifiers, init) {
  let index = -1
  /** @type {Array<VariableDeclarator>} */
  const declarations = []
  /** @type {Array<ImportSpecifier | ImportDefaultSpecifier | ExportSpecifier>} */
  const otherSpecifiers = []
  // Can only be one according to JS syntax.
  /** @type {ImportNamespaceSpecifier | undefined} */
  let importNamespaceSpecifier

  while (++index < specifiers.length) {
    const specifier = specifiers[index]

    if (specifier.type === 'ImportNamespaceSpecifier') {
      importNamespaceSpecifier = specifier
    } else {
      otherSpecifiers.push(specifier)
    }
  }

  if (importNamespaceSpecifier) {
    declarations.push(
      create(importNamespaceSpecifier, {
        type: 'VariableDeclarator',
        id: importNamespaceSpecifier.local,
        init
      })
    )
  }

  declarations.push({
    type: 'VariableDeclarator',
    id: {
      type: 'ObjectPattern',
      properties: otherSpecifiers.map((specifier) => {
        /** @type {Identifier} */
        let key =
          specifier.type === 'ImportSpecifier'
            ? specifier.imported
            : specifier.type === 'ExportSpecifier'
            ? specifier.exported
            : {type: 'Identifier', name: 'default'}
        let value = specifier.local

        // Switch them around if we’re exporting.
        if (specifier.type === 'ExportSpecifier') {
          value = key
          key = specifier.local
        }

        return create(specifier, {
          type: 'Property',
          kind: 'init',
          shorthand: key.name === value.name,
          method: false,
          computed: false,
          key,
          value
        })
      })
    },
    init: importNamespaceSpecifier
      ? {type: 'Identifier', name: importNamespaceSpecifier.local.name}
      : init
  })

  return declarations
}
