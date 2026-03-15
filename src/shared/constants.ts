/**
 * Re-export all game constants from the original location.
 * This module exists so that shared/ and game/ code can import
 * constants without depending on the old src/game/ path.
 *
 * The canonical source remains src/game/constants.ts for now.
 * Over time, gameplay constants can be moved here directly.
 */
export * from '../game/constants';
