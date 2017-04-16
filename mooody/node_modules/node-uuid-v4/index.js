'use strict'

// Native NodeJS random number generator:
const rng = require('crypto').randomBytes

// bytes-to-hex map:
const bth = []
for (let i = 0; i < 256; ++i) {
  bth[i] = (i + 0x100).toString(16).substr(1)
}

function bytesToUUID (buf) {
  let i = 0
  // eslint-disable-next-line no-multi-spaces
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]]
}

function uuidv4 () {
  const rnds = rng(16)
  // Per RFC 4122 4.4, set bits for version and `clock_seq_hi_and_reserved`:
  rnds[6] = (rnds[6] & 0x0f) | 0x40
  rnds[8] = (rnds[8] & 0x3f) | 0x80
  return bytesToUUID(rnds)
}

module.exports = uuidv4
