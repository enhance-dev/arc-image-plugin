function getConfig ({ arc }) {
  const config = arc['enhance-image'].reduce((config, option) => {
    if (option['widths']) {
      config.widths = option.widths
    }

    if (Array.isArray(option)) {
      const [ key, value ] = option
      config[key] = value
    }

    return config
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
