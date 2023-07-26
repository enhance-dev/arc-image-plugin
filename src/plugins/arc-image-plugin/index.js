const path = require('path')
const os = require('os')
const fs = require('fs')

const formatPath = require('./format-path.js')
const getImagePaths = require('./get-image-paths.js')

module.exports = {
  formatPath,
  sandbox: {
    start: function ({ arc, inventory }) {
      const imagePaths = getImagePaths({ arc, inventory })

      // Mmm, let's generate those images
      // TODO: sandbox.start will run every time the project files change — safe to rerun this every time…?
      console.log({ imagePaths })
    }
  },
  deploy: {
    start: function ({ arc, inventory }) {
      const imagePaths = getImagePaths({ arc, inventory })

      // Mmm, let's generate those images
      console.log({ imagePaths })
    }
  },
  set: {
    static: function () {
      return { ignore: [ '.image-transform-cache' ] }
    },
    http: function () {
      return { method: 'get', path: '/transform/*', src: path.join(__dirname, 'image-handler'), config: { timeout: 30 } }
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
