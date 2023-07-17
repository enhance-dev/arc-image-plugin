const path = require('path')
const os = require('os')
const fs = require('fs')

const formatPath = require('./format-path.js')
const getConfig = require('./get-config.js')

module.exports = {
  formatPath,
  hydrate: {
    copy: async function ({ arc, inventory, copy }) {
      const config = getConfig({ arc })
      const configFile = `export default ${JSON.stringify(config)}`
      const { cwd } = inventory.inv._project
      const outputDir = path.join(cwd, '.enhance')
      fs.mkdirSync(outputDir, { recursive: true })
      const filePath = path.join(outputDir, 'image-config.mjs')
      fs.writeFileSync(filePath, configFile)
      await copy({
        // Source can't be `filePath` b/c bug in hydrate
        source: '.enhance/image-config.mjs',
        target: `@architect/shared/enhance-image/image-config.mjs`,
      })
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
