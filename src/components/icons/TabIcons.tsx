import Svg, { Path } from 'react-native-svg';

// Path data copied verbatim from the iBank UI kit's exported tab-bar icon
// assets (Figma file FF0BWy73BmBus4FqFestBj, "Tab bar / Home" and
// "Card / Beneficiary / Add new" components) — not hand-drawn. `color` is
// exposed as a prop instead of the kit's hardcoded fill/stroke so each icon
// can follow the app's light/dark theme and active/inactive tab state.

export function HomeIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size * (18.3332 / 20)} viewBox="0 0 20 18.3332" fill="none">
      <Path
        d="M19.6843 7.68821L10.5176 0.188207C10.3688 0.0664931 10.1824 0 9.99011 0C9.79783 0 9.61147 0.0664931 9.46261 0.188207L0.295947 7.68821C0.128718 7.8293 0.023691 8.03051 0.0035429 8.24838C-0.0166052 8.46625 0.0497424 8.68331 0.18826 8.85268C0.326777 9.02205 0.52635 9.13015 0.743888 9.15364C0.961425 9.17712 1.17947 9.11411 1.35095 8.97821L2.49011 8.04654V17.4999C2.49011 17.7209 2.57791 17.9328 2.73419 18.0891C2.89047 18.2454 3.10243 18.3332 3.32345 18.3332H8.32345V13.3332H11.6568V18.3332H16.6568C16.8778 18.3332 17.0898 18.2454 17.246 18.0891C17.4023 17.9328 17.4901 17.7209 17.4901 17.4999V8.04654L18.6293 8.97821C18.7137 9.04947 18.8115 9.10322 18.917 9.13634C19.0224 9.16945 19.1334 9.18126 19.2434 9.17109C19.3534 9.16091 19.4604 9.12895 19.5579 9.07706C19.6555 9.02518 19.7418 8.9544 19.8117 8.86886C19.8817 8.78331 19.934 8.68471 19.9654 8.57878C19.9969 8.47285 20.007 8.36172 19.9952 8.25185C19.9833 8.14197 19.9497 8.03556 19.8964 7.93879C19.843 7.84203 19.7709 7.75685 19.6843 7.68821V7.68821Z"
        fill={color}
      />
    </Svg>
  );
}

export function PeriodsIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size * (24 / 20)} viewBox="0 0 20 24" fill="none">
      <Path
        d="M19 0H1C0.448 0 0 0.447 0 1V24L4 21L7 24L10 21L13 24L16 21L20 24V1C20 0.447 19.552 0 19 0ZM11 16H4V14H11V16ZM11 12H4V10H11V12ZM11 8H4V6H11V8ZM16 16H13V14H16V16ZM16 12H13V10H16V12ZM16 8H13V6H16V8Z"
        fill={color}
      />
    </Svg>
  );
}

export function AddIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M21 10H12V1C12 0.4 11.6 0 11 0C10.4 0 10 0.4 10 1V10H1C0.4 10 0 10.4 0 11C0 11.6 0.4 12 1 12H10V21C10 21.6 10.4 22 11 22C11.6 22 12 21.6 12 21V12H21C21.6 12 22 11.6 22 11C22 10.4 21.6 10 21 10Z"
        fill={color}
      />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 23.5 23.5" fill="none">
      <Path
        d="M22.75 13.25V10.25L19.502 9.807C19.311 9.04471 19.0077 8.31507 18.602 7.642L20.586 5.032L18.468 2.911L15.858 4.895C15.1849 4.48934 14.4553 4.18603 13.693 3.995L13.25 0.75H10.25L9.807 3.998C9.04471 4.18903 8.31507 4.49234 7.642 4.898L5.032 2.911L2.911 5.032L4.895 7.642C4.48934 8.31507 4.18603 9.04471 3.995 9.807L0.75 10.25V13.25L3.998 13.693C4.18903 14.4553 4.49234 15.1849 4.898 15.858L2.914 18.468L5.035 20.589L7.645 18.605C8.31807 19.0107 9.04771 19.314 9.81 19.505L10.25 22.75H13.25L13.693 19.502C14.4553 19.311 15.1849 19.0077 15.858 18.602L18.468 20.586L20.589 18.465L18.605 15.855C19.0107 15.1819 19.314 14.4523 19.505 13.69L22.75 13.25Z"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="square"
      />
      <Path
        d="M11.75 14.75C13.4069 14.75 14.75 13.4069 14.75 11.75C14.75 10.0931 13.4069 8.75 11.75 8.75C10.0931 8.75 8.75 10.0931 8.75 11.75C8.75 13.4069 10.0931 14.75 11.75 14.75Z"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="square"
      />
    </Svg>
  );
}
