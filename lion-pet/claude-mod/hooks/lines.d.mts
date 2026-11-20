import type { LionState } from './lion.mjs'
export declare const BANNED: string[]
export declare const LINES: Record<string, string[]>
export declare function pickLine(state: LionState, trigger: string, rng?: () => number): string
