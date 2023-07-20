const fs = require('fs')
const path = require('path')

const getConfig = require('./get-config.js')

/**
 * Writes the plugin config from the project's `.arc` file to the `.enhance` directory so the Enhance Image component can use it
 */
function writeConfig ({ arc, inventory }) {
  const config = getConfig({ arc })
  const configFile = `export default ${JSON.stringify(config)}`
  const { cwd } = inventory.inv._project
  const outputDir = path.join(cwd, '.enhance')

  fs.mkdirSync(outputDir, { recursive: true })

  const filePath = path.join(outputDir, 'image-config.mjs')
  fs.writeFileSync(filePath, configFile)
}

module.exports = writeConfig
