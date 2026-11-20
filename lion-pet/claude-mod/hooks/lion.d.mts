export type Needs = { hunger: number; energy: number; fun: number; pride: number }
export type LionState = {
  name: string; stage: string; needs: Needs; bond: number; bornAt: number; lastTick: number
  cooldowns: Record<string, number>; lastAction: { name: string; at: number } | null
}
export declare function createLion(now: number, name?: string): LionState
export declare function tick(state: LionState, now: number, opts?: { restWhileAway?: boolean }): LionState
export declare function act(state: LionState, action: string, now: number): { state: LionState; ok: boolean; reason?: 'cooldown' | 'unknown' }
export declare function mood(state: LionState, now: number): string
