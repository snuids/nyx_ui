/**
 * The password generator behind "generate a password" (password rules tester, and the
 * administrator's reset-password dialog).
 *
 * Both screens used to draw it with `Math.random()` — a predictable generator, seeded from a
 * small state, and reshuffled by `sort(() => 0.5 - Math.random())`, which is both biased and
 * engine-dependent. A password an administrator **hands over** is exactly the one that must not
 * be recoverable from another output of the same generator, so this module draws from
 * `crypto.getRandomValues` (CSPRNG) with rejection sampling — no modulo bias — and reshuffles
 * with Fisher–Yates.
 *
 * The alphabets drop what people misread when they read a password aloud or type it from a chat
 * message: `0/O/o`, `1/l/I/|`, and the punctuation that a URL, a shell or a spreadsheet formula
 * mangles (`"`, `'`, `` ` ``, `;`, `\`, brackets). What is left is unambiguous at 12+ characters,
 * which matters more than the symbol count (NIST SP 800-63B, ANSSI: length, not composition —
 * but the instance's own rules are still honoured, since the server validates them).
 *
 * There is **no fallback** to `Math.random()`: without a CSPRNG the generation fails loudly
 * rather than returning a weak password that looks fine.
 */

// 0/O/o, 1/l/I/| are absent on purpose: they are the pairs an operator gets wrong when they
// retype a password read from a screen or a message.
export const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const LOWER = "abcdefghijkmnpqrstuvwxyz";
export const DIGIT = "23456789";
export const SPECIAL = "!#$%&*+-=?@^_";

const FULL = LOWER + UPPER + DIGIT + SPECIAL;

/** The CSPRNG, or a thrown error — never a quiet downgrade. */
function randomSource() {
  const source =
    (typeof globalThis !== "undefined" && globalThis.crypto) ||
    (typeof window !== "undefined" && window.crypto) ||
    null;
  if (!source || typeof source.getRandomValues !== "function") {
    throw new Error("crypto.getRandomValues is required to generate a password");
  }
  return source;
}

/**
 * Uniform integer in `[0, maxExclusive)`.
 *
 * `value % max` alone is biased towards the low values (2^32 is not a multiple of `max`), so
 * the values of the last incomplete bucket are rejected and drawn again.
 */
export function randomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("randomInt expects a positive integer, got " + maxExclusive);
  }
  const source = randomSource();
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value;
  do {
    source.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % maxExclusive;
}

/** One character of `alphabet`, uniformly drawn. */
function pick(alphabet) {
  return alphabet[randomInt(alphabet.length)];
}

/** In-place Fisher–Yates, then the same array — uniform, unlike a random comparator. */
export function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const swap = items[i];
    items[i] = items[j];
    items[j] = swap;
  }
  return items;
}

function bound(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

/**
 * A password that satisfies `rules` (the shape of `nyx_privilege.passwordRules`):
 * `{length: [min, max], forceUpper, minUpper, forceNumber, minNumber, forceSpecial, minSpecial}`.
 *
 * A rule that is not forced is not counted, even when it carries a minimum: that is how the
 * server validates it too.
 */
export function generatePassword(rules) {
  // An instance with no password rules (the privilege document carries `passwordRules: null`)
  // must still produce a usable password, not a TypeError.
  const settings = rules && typeof rules === "object" ? rules : {};
  const range = Array.isArray(settings.length) ? settings.length : [];
  const minLength = Math.max(1, bound(range[0], 12));
  const maxLength = Math.max(minLength, bound(range[1], Math.max(minLength, 18)));

  const wantedUpper = settings.forceUpper ? bound(settings.minUpper, 1) : 0;
  const wantedDigit = settings.forceNumber ? bound(settings.minNumber, 1) : 0;
  const wantedSpecial = settings.forceSpecial ? bound(settings.minSpecial, 1) : 0;
  const mandatory = wantedUpper + wantedDigit + wantedSpecial;

  const floor = Math.max(minLength, mandatory);
  const ceiling = Math.max(maxLength, floor);
  const length = floor + randomInt(ceiling - floor + 1);

  const characters = [];
  for (let i = 0; i < wantedUpper; i++) characters.push(pick(UPPER));
  for (let i = 0; i < wantedDigit; i++) characters.push(pick(DIGIT));
  for (let i = 0; i < wantedSpecial; i++) characters.push(pick(SPECIAL));

  // The rest from the whole set: a password made only of the forced classes is guessable in
  // shape, and the rules never forbid the other characters.
  while (characters.length < length) characters.push(pick(FULL));

  return shuffle(characters).join("");
}
