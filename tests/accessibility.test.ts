import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const sourceFiles = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? sourceFiles(path.join(dir, item.name)) : item.name.endsWith('.tsx') ? [path.join(dir, item.name)] : []);

test('icon-only buttons, including hidden admin layouts and modal backdrops, declare accessible names', () => {
  const missing: string[] = [];
  for (const file of sourceFiles('src')) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const icons = new Set<string>();
    source.forEachChild(node => { if (ts.isImportDeclaration(node) && node.moduleSpecifier.getText(source).includes('lucide-react') && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) node.importClause.namedBindings.elements.forEach(item => icons.add(item.name.text)); });
    const graphic = (node: ts.Node): boolean => {
      if (ts.isJsxText(node)) return !/\p{L}/u.test(node.text);
      if (ts.isJsxExpression(node)) return !node.expression || graphic(node.expression);
      if (ts.isNumericLiteral(node) || node.kind === ts.SyntaxKind.NullKeyword || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return true;
      if (ts.isConditionalExpression(node)) return graphic(node.whenTrue) && graphic(node.whenFalse);
      if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind)) return graphic(node.right);
      if (ts.isJsxFragment(node)) return node.children.every(graphic);
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = (ts.isJsxElement(node) ? node.openingElement : node).tagName.getText(source);
        if (icons.has(tag) || ['svg', 'img', 'Icon', 'I'].includes(tag)) return true;
        if (ts.isJsxElement(node) && ['span', 'div', 'b', 'small', 'strong'].includes(tag)) return node.children.every(graphic);
      }
      return false;
    };
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        if (['button', 'motion.button'].includes(opening.tagName.getText(source))) {
          const children = ts.isJsxElement(node) ? node.children : [];
          if (children.every(graphic) && !opening.attributes.properties.some(attribute => ts.isJsxAttribute(attribute) && ['aria-label', 'aria-labelledby'].includes(attribute.name.getText(source)))) missing.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(missing, []);
});

test('keyboard order follows the document instead of positive tabindex values', () => {
  const reordered: string[] = [];
  for (const file of sourceFiles('src')) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node) && node.name.getText(source) === 'tabIndex') {
        const value = node.initializer;
        const literal = value && (ts.isStringLiteral(value) ? value.text : ts.isJsxExpression(value) && value.expression && ts.isNumericLiteral(value.expression) ? value.expression.text : '');
        if (literal && Number(literal) > 0) reordered.push(file);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(reordered, []);
});

test('every native button explicitly declares its type to prevent accidental form submission', () => {
  const missing: string[] = [];
  for (const file of sourceFiles('src')) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && (node.tagName.getText(source) === 'button' || node.tagName.getText(source).endsWith('.button'))) {
        const type = node.attributes.properties.find((attribute): attribute is ts.JsxAttribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'type');
        const value = type?.initializer;
        if (!value || !ts.isStringLiteral(value) || !['button', 'submit', 'reset'].includes(value.text)) missing.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(missing, []);
});
