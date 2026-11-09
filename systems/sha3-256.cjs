'use strict';

// Byte-oriented SHA3-256 (FIPS 202 sections 3, 4 and 6.1), implemented without
// OpenSSL/BoringSSL algorithm availability. Used only for public onion address
// checksums; this is not a claim of CAVP validation or constant-time execution.
// https://doi.org/10.6028/NIST.FIPS.202
const RATE_BYTES = 136; // 1600-bit state minus 512-bit capacity.
const MASK64 = (1n << 64n) - 1n;
// Lane index is x + 5*y, with little-endian bytes within each 64-bit lane.
const ROTATIONS = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14
];
const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

function rotate64(value, count) {
  const shift = BigInt(count);
  return ((value << shift) | (value >> (64n - shift))) & MASK64;
}

function permute(state) {
  const columns = Array(5), differences = Array(5), moved = Array(25);
  for (const roundConstant of ROUND_CONSTANTS) {
    // theta
    for (let x = 0; x < 5; x++) columns[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    for (let x = 0; x < 5; x++) differences[x] = columns[(x + 4) % 5] ^ rotate64(columns[(x + 1) % 5], 1);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) state[x + 5 * y] ^= differences[x];
    // rho and pi: B[y, 2*x + 3*y] = ROT(A[x,y], r[x,y]).
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      moved[y + 5 * ((2 * x + 3 * y) % 5)] = rotate64(state[x + 5 * y], ROTATIONS[x + 5 * y]);
    }
    // chi reads only the previous round's moved lanes.
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      state[x + 5 * y] = moved[x + 5 * y] ^ ((~moved[(x + 1) % 5 + 5 * y]) & moved[(x + 2) % 5 + 5 * y]);
    }
    // iota
    state[0] ^= roundConstant;
  }
}

function sha3_256(input) {
  if (!(input instanceof Uint8Array)) throw new TypeError('SHA3-256 requires Uint8Array bytes');
  const state = Array(25).fill(0n);
  const absorb = (bytes, offset) => {
    for (let i = 0; i < RATE_BYTES; i++) state[i >> 3] ^= BigInt(bytes[offset + i]) << BigInt((i & 7) * 8);
    permute(state);
  };
  let offset = 0;
  for (; offset + RATE_BYTES <= input.length; offset += RATE_BYTES) absorb(input, offset);
  const tail = new Uint8Array(RATE_BYTES);
  tail.set(input.subarray(offset));
  // SHA-3's delimited suffix is 0x06, not legacy Keccak's 0x01. Padding is
  // also required after an exact multiple of the rate, including empty input.
  tail[input.length - offset] ^= 0x06;
  tail[RATE_BYTES - 1] ^= 0x80;
  absorb(tail, 0);
  const digest = new Uint8Array(32);
  for (let i = 0; i < digest.length; i++) digest[i] = Number((state[i >> 3] >> BigInt((i & 7) * 8)) & 255n);
  return digest;
}

module.exports = { sha3_256 };
