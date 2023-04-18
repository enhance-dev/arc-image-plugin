const  sandbox  = require('@architect/sandbox')
// const gm = require('gm').subClass({ imageMagick: true })
const test = require('tape')
const tiny = require('tiny-json-http')
const sizeOf = require('image-size')
const path = require('path')
const mochDir = path.join(__dirname, 'image-plugin-example')
const baseUrl = 'http://localhost:3333'
// async function sizeOf (buf) {
//   return new Promise(function (resolve, reject) {
//     gm(buf)
//       .size(function (err, data) {
//         if (err) {
//           reject(err)
//         }
//         else {
//           resolve(data)
//         }
//       })
//   })
// }

test('start sandbox', async t => {
  t.plan(1)
  let result = await sandbox.start({ cwd: mochDir })
  t.equal(result, 'Sandbox successfully started', 'Sandbox started')
})

test('Gets original png image', async t => {
  t.plan(1)
  let result = await tiny.get({ url: baseUrl + '/_static/images/elephant.png', buffer: true })
  // output all available image properties
  let size = await sizeOf(result.body)
  // meta data { height: 5223, width: 4781, type: 'png' }
  t.ok(size.width === 4781 && size.type === 'png', 'original image returned')
})

test('Transforms png image', async t => {
  t.plan(4)
  let startFirst = Date.now()
  let result = await tiny.get({ url: baseUrl + '/transform/images/elephant.png?width=100&height=100', buffer: true })
  let durationFirst = Date.now() - startFirst
  let size = await sizeOf(result.body)
  // { height: 100, width: 92, type: 'png' }
  t.ok(size.height === 100, 'transformed image returned without cache')
  t.ok(durationFirst > 1000, 'image took more than two second (meaning it was likely not cached)')
  let startSecond = Date.now()
  result = await tiny.get({ url: baseUrl + '/transform/images/elephant.png?width=100&height=100', buffer: true })
  let durationSecond = Date.now() - startSecond
  t.ok(size.height === 100, 'transformed image returned from cache')
  t.ok(durationSecond < 1000, 'image took less than 1 seconds including some test overhead time (meaning it was likely cached)')
})

test('Gets original jpg image', async t => {
  t.plan(1)
  let result = await tiny.get({ url: baseUrl + '/_static/images/big.jpg', buffer: true })
  let size = await sizeOf(result.body)
  // meta data { height: 5879, width: 3919, type: 'jpg' }
  t.ok(size.width === 3919 && size.type === 'jpg', 'original image returned')
})

test('Transforms jpg image', async t => {
  t.plan(4)
  let startFirst = Date.now()
  let result = await tiny.get({ url: baseUrl + '/transform/images/big.jpg?width=100&height=100', buffer: true })
  let durationFirst = Date.now() - startFirst
  let size = await sizeOf(result.body)
  console.log(size)
  t.ok(size.height === 100, 'transformed image returned without cache')
  t.ok(durationFirst > 1000, 'image took more than two second (meaning it was likely not cached)')
  let startSecond = Date.now()
  result = await tiny.get({ url: baseUrl + '/transform/images/big.jpg?width=100&height=100', buffer: true })
  let durationSecond = Date.now() - startSecond
  t.ok(size.height === 100, 'transformed image returned from cache')
  t.ok(durationSecond < 1000, 'image took less than 1 seconds including some test overhead time (meaning it was likely cached)')
})

test('input of fingerprinted path', async t => {
  t.plan(4)
  let startFirst = Date.now()
  let result = await tiny.get({ url: baseUrl + '/transform/_static/images/elephant.png?width=200&height=200', buffer: true })
  let durationFirst = Date.now() - startFirst
  let size = await sizeOf(result.body)
  console.log(size)
  // { height: 200, width: 183, type: 'png' }
  t.ok(size.height === 200, 'transformed image returned without cache')
  t.ok(durationFirst > 1000, 'image took more than two second (meaning it was likely not cached)')
  let startSecond = Date.now()
  result = await tiny.get({ url: baseUrl + '/transform/_static/images/elephant.png?width=200&height=200', buffer: true })
  let durationSecond = Date.now() - startSecond
  t.ok(size.height === 200, 'transformed image returned from cache')
  t.ok(durationSecond < 1000, 'image took less than 1 seconds including some test overhead time (meaning it was likely cached)')
})


test('Shut down the Sandbox', async t => {
  t.plan(1)
  let result = await sandbox.end()
  t.equal(result, 'Sandbox successfully shut down', 'Sandbox shutdown')
})

