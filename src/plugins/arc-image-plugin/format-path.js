function formatPath ({
  src,
  width,
  quality,
  format,
}) {
  const widthParam = `width_${width}`
  const qualityParam = quality ? `quality_${quality}` : ''
  const formatParam = format ? `format_${format}` : ''

  // Build the full transform path
  const transforms =
    [ widthParam, qualityParam, formatParam ]
      .reduce((result, opt) => {
        return opt ? `${result},${opt}` : result
      }, '')
      .replace(',', '') // Strip the leading comma

  return `/transform/${transforms}${src}`
}

module.exports = formatPath
