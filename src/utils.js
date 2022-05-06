export const getBit = (number, location) => {
  return (number >> location) & 1
}

export const setBit = (number, location, bit) => {
  return (number & ~(1 << location)) | (bit << location)
}

export const getBitsFromNumber = number => {
  const bits = []
  for (let i = 0; i < 16; i++) {
    bits.push(getBit(number, i))
  }
  return bits
}

export const getNumberFromBits = (bytes, history, hash) => {
  let number = 0,
    pos = 0
  while (pos < 16) {
    const loc = getNextLocation(history, hash, bytes.length)
    const bit = getBit(bytes[loc], 0)
    number = setBit(number, pos, bit)
    pos++
  }
  return number
}

export const getMessageBits = message => {
  let messageBits = []
  for (let i = 0; i < message.length; i++) {
    let code = message.charCodeAt(i)
    messageBits = messageBits.concat(getBitsFromNumber(code))
  }
  return messageBits
}

export const getNextLocation = (history, hash, total) => {
  let pos = history.length
  let loc = Math.abs(hash[pos % hash.length] * (pos + 1)) % total
  while (true) {
    if (loc >= total) {
      loc = 0
    } else if (history.indexOf(loc) >= 0) {
      loc++
    } else if ((loc + 1) % 4 === 0) {
      loc++
    } else {
      history.push(loc)
      return loc
    }
  }
}

export const encodeMessage = (colors, hash, message) => {
  let messageBits = getBitsFromNumber(message.length)
  messageBits = messageBits.concat(getMessageBits(message))
  const history = []
  let pos = 0
  while (pos < messageBits.length) {
    let loc = getNextLocation(history, hash, colors.length)
    colors[loc] = setBit(colors[loc], 0, messageBits[pos])
    while ((loc + 1) % 4 !== 0) {
      loc++
    }
    colors[loc] = 255
    pos++
  }
}

export const decodeMessage = (colors, hash, maxMessageSize) => {
  // this will store the color values we've already read from
  const history = []
  // get the message size
  let messageSize = getNumberFromBits(colors, history, hash)
  // exit early if the message is too big for the image
  if ((messageSize + 1) * 16 > colors.length * 0.75) {
    return ''
  }
  // exit early if the message is above an artificial limit
  if (messageSize === 0 || messageSize > maxMessageSize) {
    return ''
  }
  // put each character into an array
  let message = []
  for (let i = 0; i < messageSize; i++) {
    let code = getNumberFromBits(colors, history, hash)
    message.push(String.fromCharCode(code))
  }
  // the characters should parse into valid JSON
  return message.join('')
}
