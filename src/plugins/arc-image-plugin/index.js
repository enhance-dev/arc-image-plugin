const path = require('path')
const os = require('os')
const fs = require('fs')


module.exports = {
  set: {
    static: function () {
      return { ignore: [ '.image-transform-cache' ] }
    },
    http: function () {
      return { method: 'get', path: '/transform/*', src: path.join(__dirname,'image-handler'), config: { timeout: 30 } }
    },
    env: function ({ arc }) {
      const localCacheBucket = fs.mkdtempSync(path.join(os.tmpdir(), 'arc-image-cache'))
      const fingerprint = arc?.static?.fingerprint || false
      return {
        testing: {
          ARC_IMAGE_PLUGIN_FINGERPRINT: fingerprint,
          ARC_IMAGE_PLUGIN_LOCAL_CACHE: localCacheBucket  }
      }
    },
  },
}
