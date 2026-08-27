import type { AppColors } from './useAppColors';

declare module 'styled-components/native' {
  export interface DefaultTheme extends AppColors {}
}
