const fs = require('fs')
const path = require('path')

function getConfig ({ inventory }) {
  const { cwd } = inventory.inv._project

  const enhanceConfigPath = path.join(cwd, 'enhance.json')
  const enhanceConfigExists = fs.existsSync(enhanceConfigPath)

  let options = {}
  if (enhanceConfigExists) {
    const contents = fs.readFileSync(enhanceConfigPath)
    const { '@enhance/image': imageConfig } = JSON.parse(contents)
    options = imageConfig
  }

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
