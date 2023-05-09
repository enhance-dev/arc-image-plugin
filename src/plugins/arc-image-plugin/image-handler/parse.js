module.exports = function parseUrl (urlPart) {
  const parts = urlPart.split('/').filter(Boolean)
  let paramGroups = []
  let currentGroup = {}
  let srcPath = ''

  for (const part of parts) {
    if (part === 'source') {
      srcPath = parts.slice(parts.indexOf(part) + 1).join('/')
      break
    }
    else if (part.startsWith('_public')) {
      srcPath = parts.slice(parts.indexOf(part)).join('/')
      break
    }
    else {
      if (part.includes(',')) {
        const params = part.split(',')
        for (const param of params) {
          if (param.includes('_')) {
            const [ key, value ] = param.split('_')
            currentGroup[key] = value
          }
          else {
            currentGroup[param] = true
          }
        }
      }
      else {
        if (part.includes('_')) {
          const [ key, value ] = part.split('_')
          currentGroup[key] = value
        }
        else {
          currentGroup[part] = true
        }
      }
      paramGroups.push(currentGroup)
      currentGroup = {}
    }
  }

  return {
    parameterGroups: paramGroups,
    srcPath: srcPath
  }
}
