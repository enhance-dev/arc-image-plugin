const test = require('tape')
const {parseUrl} = require('../src/plugins/arc-image-plugin/image-handler/index.js')

test('parse urls', async t => {
  t.plan(1)
  let url = '/w_100,h_100,c_fill/_public/images/big.jpg'
  let expected = { srcPath: `_public/images/big.jpg`, parameterGroups: [ { w: '100', h: '100', c: 'fill' } ] }
  t.deepEqual(parseUrl(url), expected, 'parse urls')
})

test('multiple groups', async t => {
  t.plan(1)
  let url = '/w_100,h_100,c_fill/w_100,h_100,c_fill/_public/images/big.jpg'
  let expected = { srcPath: `_public/images/big.jpg`, parameterGroups: [ { w: '100', h: '100', c: 'fill' }, { w: '100', h: '100', c: 'fill' } ] }
  t.deepEqual(parseUrl(url), expected, 'multiple groups')
})

test('boolean parameters', async t => {
  t.plan(1)
  let url = '/bool/_public/images/big.jpg'
  let expected = { srcPath: `_public/images/big.jpg`, parameterGroups: [ { bool: true } ] }
  t.deepEqual(parseUrl(url), expected, 'boolean parameters')
})
