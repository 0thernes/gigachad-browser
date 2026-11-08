import type * as R from "react";
export const Fragment: typeof R.Fragment; export const useEffect: typeof R.useEffect; export const useRef: typeof R.useRef; export const useState: typeof R.useState;
export function Button(p: { label: string; onClick: () => void; variant?: string }): R.ReactElement;
export function Toggle(p: { label: string; value: boolean; onChange: (v: boolean) => void }): R.ReactElement;
export function useGrokTheme(): { text: { primary: string; secondary: string }; font: { mono: string; family: string }; border: { default: string }; dataviz: { categorical: string[] } };
