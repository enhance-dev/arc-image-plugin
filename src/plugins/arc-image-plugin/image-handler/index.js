const Vips = require('wasm-vips')
const arc = require('@architect/functions')
const awsLite = require('@aws-lite/client')
const fs = require('fs')
const normalizedStringify = require('json-stable-stringify')
const path = require('path')
const { createHash } = require('crypto')

const env = process.env.ARC_ENV || process.env.NODE_ENV
const isLive = (env === 'staging' || env === 'production')
const discovery = arc.services() // returns a promise, await in handler
const fourOhFour = { statusCode: 404 }
const staticDir = process.env.ARC_STATIC_BUCKET
let discovered, cacheBucket
const imageCacheFolderName = '.image-transform-cache'

let aws

async function getAws () {
  if (!aws) aws = await awsLite({
    region: process.env.AWS_REGION,
    plugins: [ import('@aws-lite/s3') ]
  })
  return aws
}

function antiCache ({ mime }) {
  return {
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    'accept-ranges': 'bytes',
    'content-type': `${mime}; charset=utf8`,
  }
}
function longCache ({ mime }) {
  return  {
    'cache-control': 'max-age=31536000',
    'content-type': `${mime}; charset=utf8`,
  }
}
function imageResponse ({ mime, buffer, cachePath }){
  const tooBig = Buffer.byteLength(buffer) > 5000000
  if (tooBig) {
    return {
      statusCode: 302,
      headers: { Location: `/_static/${cachePath}` }
    }
  }
  let fingerprint = isLive ? discovered.static.fingerprint : process.env.ARC_IMAGE_PLUGIN_FINGERPRINT
  return { statusCode: 200,
    headers: fingerprint ? longCache({ mime }) : antiCache({ mime }),
    isBase64Encoded: true,
    body: buffer.toString('base64')
  }
}


module.exports = {
  handler: async function (req){

    const { S3 } = await getAws()

    discovered = await discovery
    cacheBucket = isLive ? staticDir : process.env.ARC_IMAGE_PLUGIN_LOCAL_CACHE

    // Validate request parameters
    let { srcPath, parameterGroups } = parseUrl(req.pathParameters.proxy)
    let imagePath = srcPath.replace(/_static\//i, '').replace(/_public\//i, '')
    if (!imagePath) return fourOhFour
    let params = parameterGroups[0]

    let allowedParams = {
      width: params?.width, // in pixels
      height: params?.height,  // in pixels
      quality: params?.quality, // 0 to 100
      format: params?.format, // output file format
      fit: params?.fit, // cover or contain
      focus: params?.focus, // top, right, bottom, left, top-right, bottom-right, bottom-left, top-left
      mark: params?.mark !== undefined ? true : false,
      x: params?.x,
      y: params?.y,
    }

    const imageFormats = {
      jpeg: { extOut: 'jpeg', mime: 'image/jpeg' },
      jpg: { extOut: 'jpeg', mime: 'image/jpeg' },
      png: { extOut: 'png', mime: 'image/png' },
      avif: { extOut: 'avif', mime: 'image/avif' },
      webp: { extOut: 'webp', mime: 'image/webp' },
      jxl: { extOut: 'jxl', mime: 'image/jxl' },
    }


    let hash = createHash('sha256')
    hash.update(`${imagePath}:${normalizedStringify(allowedParams)}`)
    let queryFingerprint =  hash.digest('hex').slice(0, 10)
    let ext = path.extname(imagePath).slice(1)
    let extOut = imageFormats?.[allowedParams?.format]?.extOut || imageFormats[ext].extOut
    if (!extOut) return fourOhFour
    let mime = imageFormats[extOut].mime

    // check cache
    let cachePath = `${imageCacheFolderName}/${queryFingerprint}.${extOut}`

    let buffer

    let exists = true
    if (isLive) {
    // read from s3
      let Bucket = cacheBucket
      let Key = cachePath
      try {
        const response = await S3.GetObject({ Bucket, Key })
        buffer = response.Body
      }
      catch (e){
        exists = false
      }
    }
    else {
    // read from local filesystem
      let pathToFile = path.join(cacheBucket, cachePath)
      try {
        buffer = fs.readFileSync(pathToFile)
      }
      catch (e){
        exists = false
      }
    }

    if (exists) {
      return imageResponse({ mime, buffer: Buffer.from(buffer), cachePath })
    }

    // Transform
    // 1. first get the original image
    exists = true
    if (isLive) {
    // read from s3
      let Bucket = staticDir
      let Key = imagePath
      try {
        const response = await S3.GetObject({ Bucket, Key })
        buffer = response.Body
      }
      catch (e) {
        exists = false
      }
    }
    else {
    // read from local filesystem
      let pathToStatic = staticDir
      let pathToFile = path.join(pathToStatic, imagePath)
      try {
        buffer = fs.readFileSync(pathToFile)
      }
      catch (e){
        exists = false
        try {
          exists = true
          buffer = fs.readFileSync(pathToFile)
        }
        catch (e){
          exists = false
        }
      }
    }


    // 2. transform it
    if (exists){
      const vips = await Vips()
      let Key = cachePath
      let image = vips.Image.newFromBuffer(buffer)

      const heightIn = image.height
      const widthIn = image.width

      const heightOut = allowedParams.height ? Number.parseInt(allowedParams.height) : 0
      const widthOut = allowedParams.width ? Number.parseInt(allowedParams.width) : 0

      const heightScale = heightOut ? heightOut / heightIn : widthOut / widthIn
      const widthScale = widthOut ? widthOut / widthIn : heightOut / heightIn

      const xPercent = allowedParams.x ? Number.parseInt(allowedParams.x) : 50
      const yPercent = allowedParams.y ? Number.parseInt(allowedParams.y) : 50

      if (allowedParams.mark) {
        const x = Math.round((xPercent / 100) * (widthIn))
        const y = Math.round((yPercent / 100) * (heightIn))
        const lineLength = Math.round(widthIn / 10)
        const lineWidth = 10
        image.drawRect([ 0, 0, 0 ], Math.round(Math.max(0, x - (lineLength / 2))), Math.round(Math.max(0, y + (lineWidth / 2))), lineLength, lineWidth, { fill: true })
        image.drawRect([ 0, 0, 0 ], Math.round(Math.max(0, x + (lineWidth / 2))), Math.round(Math.max(0, y - (lineLength / 2))), lineWidth, lineLength, { fill: true })
        image.drawRect([ 255, 255, 255 ], Math.round(Math.max(0, x - (lineLength / 2))), Math.round(Math.max(0, y - (lineWidth / 2))), lineLength, lineWidth, { fill: true })
        image.drawRect([ 255, 255, 255 ], Math.round(Math.max(0, x - (lineWidth / 2))), Math.round(Math.max(0, y - (lineLength / 2))), lineWidth, lineLength, { fill: true })
      }

      const fit = allowedParams.fit ? allowedParams.fit : 'contain'
      const focus = allowedParams.focus ? allowedParams.focus : 'center'

      if (fit === 'contain') image = image.resize(Math.min(heightScale, widthScale))
      if (fit === 'cover') {
        image = image.resize(Math.max(heightScale, widthScale))
        const heightInter = image.height
        const widthInter = image.width
        let cropStart = { left: 0, top: 0 }
        switch (focus) {
        case 'top':
          cropStart.left = Math.round((widthInter - widthOut) / 2)
          cropStart.top = 0
          break
        case 'right':
          cropStart.left = (widthInter - widthOut)
          cropStart.top = Math.round((heightInter - heightOut) / 2)
          break
        case 'bottom':
          cropStart.left = Math.round((widthInter - widthOut) / 2)
          cropStart.top = (heightInter - heightOut)
          break
        case 'left':
          cropStart.left = 0
          cropStart.top = Math.round((heightInter - heightOut) / 2)
          break
        case 'top-right':
          cropStart.left = (widthInter - widthOut)
          cropStart.top = 0
          break
        case 'bottom-right':
          cropStart.left = (widthInter - widthOut)
          cropStart.top = (heightInter - heightOut)
          break
        case 'bottom-left':
          cropStart.left = 0
          cropStart.top = (heightInter - heightOut)
          break
        case 'top-left':
          cropStart.left = 0
          cropStart.top = 0
          break
        case 'center':
          cropStart.left = Math.round((widthInter - widthOut) / 2)
          cropStart.top = Math.round((heightInter - heightOut) / 2)
          break
        case 'point':
          cropStart.left = Math.max(Math.min((widthInter - widthOut), Math.round((widthInter * (xPercent / 100)) - widthOut / 2)), 0)
          cropStart.top = Math.max(Math.min((heightInter - heightOut), Math.round((heightInter * (yPercent / 100)) - heightOut / 2)), 0)
          break
        default:
          cropStart.left = Math.round((widthInter - widthOut) / 2)
          cropStart.top = Math.round((heightInter - heightOut) / 2)
          break
        }

        image = image.crop(cropStart.left, cropStart.top, widthOut, heightOut)

      }

      let options = {}
      if (allowedParams.quality) options.Q = allowedParams.quality
      let output = image.writeToBuffer('.' + extOut, options)
      const outputBuffer = Buffer.from(output)

      if (isLive) {
        await S3.PutObject({
          ContentType: mime,
          Bucket: cacheBucket,
          Key,
          Body: outputBuffer,
        })
      }
      else {
        if (!fs.existsSync(`${cacheBucket}/${imageCacheFolderName}`)) fs.mkdirSync(`${cacheBucket}/${imageCacheFolderName}`)
        fs.writeFileSync(path.resolve(cacheBucket, Key), outputBuffer)
      }

      // 4. respond with the image
      return imageResponse({ mime, buffer: outputBuffer, cachePath })
    }
    else {
      return fourOhFour
    }

  },

  parseUrl

}

function parseUrl (urlPart) {
  const parts = urlPart.split('/').filter(Boolean)
  let paramGroups = []
  let currentGroup = {}
  let srcPath = ''

  for (const part of parts) {
    if (part === 'source') {
      srcPath = parts.slice(parts.indexOf(part) + 1).join('/')
      break
    }
    else if (part.startsWith('_public')) {
      srcPath = parts.slice(parts.indexOf(part)).join('/')
      break
    }
    else {
      if (part.includes(',')) {
        const params = part.split(',')
        for (const param of params) {
          if (param.includes('_')) {
            const [ key, value ] = param.split('_')
            currentGroup[key] = value
          }
          else {
            currentGroup[param] = true
          }
        }
      }
      else {
        if (part.includes('_')) {
          const [ key, value ] = part.split('_')
          currentGroup[key] = value
        }
        else {
          currentGroup[part] = true
        }
      }
      paramGroups.push(currentGroup)
      currentGroup = {}
    }
  }

  return {
    parameterGroups: paramGroups,
    srcPath: srcPath
  }
}
