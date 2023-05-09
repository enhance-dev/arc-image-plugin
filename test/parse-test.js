const test = require('tape')
const parse = require('../src/plugins/arc-image-plugin/image-handler/parse.js')

test('parse urls', async t => {
  t.plan(1)
  let url = '/w_100,h_100,c_fill/_public/images/big.jpg'
  console.log(parse(url))
  let expected = { srcPath: `_public/images/big.jpg`, parameterGroups: [ { w: '100', h: '100', c: 'fill' } ] }
  t.deepEqual(parse(url), expected, 'parse urls')
})

test('multiple groups', async t => {
  t.plan(1)
  let url = '/w_100,h_100,c_fill/w_100,h_100,c_fill/_public/images/big.jpg'
  console.log(parse(url))
  let expected = { srcPath: `_public/images/big.jpg`, parameterGroups: [ { w: '100', h: '100', c: 'fill' }, { w: '100', h: '100', c: 'fill' } ] }
  t.deepEqual(parse(url), expected, 'multiple groups')
})

test('boolean parameters', async t => {
  t.plan(1)
  let url = '/bool/_public/images/big.jpg'
  console.log(parse(url))
  let expected = { srcPath: `_public/images/big.jpg`, parameterGroups: [ { bool: true } ] }
  t.deepEqual(parse(url), expected, 'boolean parameters')
})
