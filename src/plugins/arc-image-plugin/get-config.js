function getConfig ({ arc }) {
  const pluginConfig = arc['enhance-image'] || []

  const config = pluginConfig.reduce((result, option) => {
    if (option['widths']) {
      result.widths = option.widths
    }

    if (Array.isArray(option)) {
      const [ key, value ] = option
      result[key] = value
    }

    return result
  }, {})

  const {
    widths = [ 2400, 1200, 800 ],
    format = 'webp',
    quality = 80,
  } = config

  return {
    widths,
    format,
    quality
  }
}

module.exports = getConfig
