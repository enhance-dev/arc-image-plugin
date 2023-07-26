const fs = require('fs')
const path = require('path')

function getConfig ({ arc, inventory }) {
  const { cwd } = inventory.inv._project

  const enhanceConfigPath = path.join(cwd, 'enhance.json')
  const enhanceConfigExists = fs.existsSync(enhanceConfigPath)

  let options = {}

  // Read config from the file named in the arcfile
  if (arc['enhance-image']) {
    const arcConfig = Object.fromEntries(arc['enhance-image'])
    const { config: configFile }  = arcConfig

    if (!configFile) return console.error('@enhance-image pragma in .arc should contain key "config" with path to configuration file')

    const contents = fs.readFileSync(path.join(cwd, configFile))
    options = JSON.parse(contents)
  }
  // Read config from enhance.json if it exists
  else if (enhanceConfigExists) {
    const contents = fs.readFileSync(enhanceConfigPath)
    const { '@enhance/image': imageConfig } = JSON.parse(contents)
    options = imageConfig
  }

  // Set defaults for any missing config options
  const {
    widths = [ 2400, 1200, 800 ],
    format = 'webp',
    quality = 80,
    directory = 'public/images'
  } = options

  return {
    widths,
    format,
    quality,
    directory,
  }
}

module.exports = getConfig
