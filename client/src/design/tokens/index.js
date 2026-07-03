/**
 * Lomea Design System - Token Exports
 *
 * Central export for all design tokens
 */

export { colors } from './colors';
export { spacing } from './spacing';
export { radius } from './radius';
export { typography } from './typography';
export { shadows } from './shadows';
export { motion } from './motion';

// Re-export as single tokens object
import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography } from './typography';
import { shadows } from './shadows';
import { motion } from './motion';

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  motion,
};

export default tokens;
