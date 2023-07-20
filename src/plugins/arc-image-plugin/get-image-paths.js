const fs = require('fs')
const path = require('path')

const formatPath = require('./format-path.js')
const getConfig = require('./get-config.js')

/**
 * @param {string} directory - The path to the directory to traverse
 * @param {string[]} [files] - The accumulated file paths since the previous iteration
 * @returns {string[]} The files contained recursively within `directory`
 */
function recursiveReaddir (directory, files = []) {
  const dirFiles = fs.readdirSync(directory)
  dirFiles.forEach(file => {
    const fullPath = path.join(directory, file)
    if (fs.lstatSync(fullPath).isDirectory()) {
      recursiveReaddir(fullPath, files)
    }
    else {
      files.push(fullPath)
    }
  })
  return files
}

const imageExtensions = [
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
]

/**
 * @param {object} config
 * @param {string} config.directory - The directory to recursively scan for files
 * @param {string} config.cwd - The current working directory
 * @returns {string[]} List of image paths contained within `directory` with their paths starting from `cwd`
 */
function getImages ({ directory, cwd }) {
  const images = recursiveReaddir(directory)
    .filter(file => imageExtensions.includes(path.extname(file)))
    .map(file => file.replace(cwd, ''))

  return images
}

/*
 * Returns the paths for transformed images that should be generated ahead of runtime
 */
function getImagePaths ({ arc, inventory }) {
  const { cwd } = inventory.inv._project
  const { widths, format, quality, directory } = getConfig({ arc })
  const imageDir = path.join(cwd, directory.split(path.sep)) // accounts for *nix and Windows path separators
  const imageFiles = getImages({ directory: imageDir, cwd })

  let imagePaths = []

  imageFiles.forEach(image => {
    widths.forEach(width => {
      imagePaths.push(formatPath({
        src: image,
        width,
        quality,
        format,
      }))
    })
  })

  return imageFiles
}

module.exports = getImagePaths
