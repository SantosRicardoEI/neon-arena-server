/**
 * Client prediction barrel export.
 */
export { InputBuffer, type InputSnapshot } from './input-buffer';
export { predictMovement } from './movement-prediction';
export { predictDash } from './dash-prediction';
export { interpolateRemotePlayer, setRemotePlayerTarget } from './interpolation';
export { reconcile, type ServerCorrection } from './reconciliation';
