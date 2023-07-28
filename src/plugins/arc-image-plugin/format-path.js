/**
 * @param {object} config
 * @param {string} config.src - The path to the source image in the project
 * @param {number} config.width - The desired width for the transformed image
 * @param {number} config.quality - The desired quality setting for the transformed image
 * @param {('webp'|'avif'|'jpeg'|'png')} config.format - The desired format for the transformed image
 * @returns {string} The path for the generated image
 */
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
