import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// ---- Tuning -----------------------------------------------------------------
const LANES = 3;
const START_LIVES = 3;
const MAX_LIVES = 5;
const BASE_SPEED = 0.42; // fraction of field height per second
const SPEED_PER_POINT = 0.0035;
const MAX_SPEED = 1.35;
const BASE_SPAWN_MS = 900;
const MIN_SPAWN_MS = 330;
const ITEM_SIZE = 0.11; // fraction of field height
const PLAYER_Y = 0.86; // top of the player, fraction of field height
const BEST_KEY = 'crown-rush-best';

const ITEMS = {
  coin: { glyph: '🪙', points: 1 },
  crown: { glyph: '👑', points: 5 },
  bomb: { glyph: '💣', points: 0 },
  heart: { glyph: '❤️', points: 0 },
};

function buzz(kind) {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'hit') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (kind === 'big') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are a nice-to-have; ignore devices without them.
  }
}

function pickKind(score, lives) {
  const r = Math.random();
  const bombChance = Math.min(0.28 + score * 0.002, 0.5);
  if (r < bombChance) return 'bomb';
  if (lives < MAX_LIVES && r < bombChance + 0.03) return 'heart';
  if (r < bombChance + 0.11) return 'crown';
  return 'coin';
}

function newGame() {
  return {
    lane: 1,
    items: [],
    score: 0,
    lives: START_LIVES,
    combo: 0,
    nextId: 1,
    spawnIn: 600,
    flash: 0, // ms of red flash remaining after a hit
    pops: [], // floating "+5" labels
  };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

function Game() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState('menu'); // menu | playing | paused | over
  const [best, setBest] = useState(0);
  const bestRef = useRef(0);
  const [, setFrame] = useState(0);
  const game = useRef(newGame());
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY)
      .then((v) => {
        const n = Number(v) || 0;
        bestRef.current = n;
        setBest(n);
      })
      .catch(() => {});
  }, []);

  const [newBest, setNewBest] = useState(false);

  const endGame = useCallback(() => {
    game.current.flash = 0;
    const final = game.current.score;
    const isBest = final > bestRef.current;
    setNewBest(isBest);
    if (isBest) {
      bestRef.current = final;
      setBest(final);
      AsyncStorage.setItem(BEST_KEY, String(final)).catch(() => {});
    }
    setScreen('over');
  }, []);

  // ---- Game loop -------------------------------------------------------------
  useEffect(() => {
    if (screen !== 'playing') return undefined;
    let raf;
    let last = null;

    const step = (now) => {
      if (screenRef.current !== 'playing') return;
      const dt = last == null ? 16 : Math.min(now - last, 50);
      last = now;
      const g = game.current;

      const speed = Math.min(BASE_SPEED + g.score * SPEED_PER_POINT, MAX_SPEED);
      const spawnMs = Math.max(BASE_SPAWN_MS - g.score * 6, MIN_SPAWN_MS);

      // Spawn
      g.spawnIn -= dt;
      if (g.spawnIn <= 0) {
        g.spawnIn = spawnMs * (0.7 + Math.random() * 0.6);
        g.items.push({
          id: g.nextId++,
          lane: Math.floor(Math.random() * LANES),
          y: -ITEM_SIZE,
          kind: pickKind(g.score, g.lives),
        });
      }

      // Move + collide
      const kept = [];
      for (const it of g.items) {
        it.y += speed * (dt / 1000);
        const hitsPlayer =
          it.lane === g.lane && it.y + ITEM_SIZE >= PLAYER_Y && it.y <= PLAYER_Y + ITEM_SIZE * 0.6;
        if (hitsPlayer) {
          if (it.kind === 'bomb') {
            g.lives -= 1;
            g.combo = 0;
            g.flash = 250;
            buzz('hit');
          } else if (it.kind === 'heart') {
            g.lives = Math.min(g.lives + 1, MAX_LIVES);
            g.pops.push({ id: it.id, lane: it.lane, y: PLAYER_Y, text: '+❤️', t: 700 });
            buzz('big');
          } else {
            g.combo += 1;
            const mult = 1 + Math.floor(g.combo / 10);
            const pts = ITEMS[it.kind].points * mult;
            g.score += pts;
            g.pops.push({ id: it.id, lane: it.lane, y: PLAYER_Y, text: `+${pts}`, t: 700 });
            buzz(it.kind === 'crown' ? 'big' : 'tap');
          }
          continue;
        }
        if (it.y > 1) {
          // Missing treasure breaks your combo; letting bombs fall is the goal.
          if (it.kind === 'coin' || it.kind === 'crown') g.combo = 0;
          continue;
        }
        kept.push(it);
      }
      g.items = kept;

      g.flash = Math.max(0, g.flash - dt);
      g.pops = g.pops
        .map((p) => ({ ...p, t: p.t - dt, y: p.y - 0.12 * (dt / 1000) }))
        .filter((p) => p.t > 0);

      if (g.lives <= 0) {
        endGame();
        return;
      }
      setFrame((f) => (f + 1) % 1000000);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [screen, endGame]);

  const start = () => {
    game.current = newGame();
    setScreen('playing');
  };

  const move = (dir) => {
    if (screenRef.current !== 'playing') return;
    const g = game.current;
    const next = Math.max(0, Math.min(LANES - 1, g.lane + dir));
    if (next !== g.lane) {
      g.lane = next;
      setFrame((f) => f + 1);
    }
  };

  // ---- Layout -----------------------------------------------------------------
  const g = game.current;
  const fieldW = Math.min(width, 520);
  const fieldH = height;
  const laneW = fieldW / LANES;
  const itemPx = Math.min(fieldH * ITEM_SIZE, laneW * 0.8);
  const laneX = (lane) => lane * laneW + (laneW - itemPx) / 2;
  const mult = 1 + Math.floor(g.combo / 10);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.field, { width: fieldW }]}>
        {/* Lane stripes */}
        {Array.from({ length: LANES }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.lane,
              { left: i * laneW, width: laneW },
              i % 2 === 1 && styles.laneAlt,
              i === g.lane && screen === 'playing' && styles.laneActive,
            ]}
          />
        ))}

        {/* Falling items */}
        {g.items.map((it) => (
          <Text
            key={it.id}
            style={[
              styles.item,
              {
                left: laneX(it.lane),
                top: it.y * fieldH,
                width: itemPx,
                height: itemPx,
                fontSize: itemPx * 0.78,
                lineHeight: itemPx,
              },
            ]}
          >
            {ITEMS[it.kind].glyph}
          </Text>
        ))}

        {/* Score pops */}
        {g.pops.map((p) => (
          <Text
            key={`p${p.id}`}
            style={[
              styles.pop,
              { left: p.lane * laneW, width: laneW, top: p.y * fieldH - itemPx, opacity: p.t / 700 },
            ]}
          >
            {p.text}
          </Text>
        ))}

        {/* Player */}
        <Text
          style={[
            styles.item,
            {
              left: laneX(g.lane),
              top: PLAYER_Y * fieldH,
              width: itemPx,
              height: itemPx,
              fontSize: itemPx * 0.85,
              lineHeight: itemPx,
            },
          ]}
        >
          🤴
        </Text>

        {/* Hit flash */}
        {g.flash > 0 && (
          <View pointerEvents="none" style={[styles.flash, { opacity: g.flash / 400 }]} />
        )}

        {/* Touch zones: tap left half / right half */}
        {screen === 'playing' && (
          <View style={styles.touchRow}>
            <Pressable style={styles.touchZone} onPressIn={() => move(-1)} />
            <Pressable style={styles.touchZone} onPressIn={() => move(1)} />
          </View>
        )}

        {/* HUD */}
        <View style={[styles.hud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <View style={styles.hudRow} pointerEvents="box-none">
            <Text style={styles.hudText}>{'❤️'.repeat(Math.max(g.lives, 0))}</Text>
            <Text style={styles.score}>{g.score}</Text>
            {screen === 'playing' ? (
              <Pressable onPress={() => setScreen('paused')} hitSlop={12} style={styles.pauseBtn}>
                <Text style={styles.pauseText}>II</Text>
              </Pressable>
            ) : (
              <View style={styles.pauseBtn} />
            )}
          </View>
          {screen === 'playing' && mult > 1 && <Text style={styles.combo}>x{mult} combo</Text>}
        </View>

        {/* Overlays */}
        {screen === 'menu' && (
          <Overlay>
            <Text style={styles.title}>CROWN RUSH</Text>
            <Text style={styles.subtitle}>Starring King Drastik</Text>
            <View style={styles.rules}>
              <Text style={styles.rule}>👈 Tap left or right to switch lanes 👉</Text>
              <Text style={styles.rule}>🪙 Coin +1    👑 Crown +5</Text>
              <Text style={styles.rule}>💣 Dodge bombs    ❤️ Extra life</Text>
              <Text style={styles.rule}>Catch 10 in a row for a combo bonus</Text>
            </View>
            <Button label="PLAY" onPress={start} />
            {best > 0 && <Text style={styles.best}>Best: {best}</Text>}
          </Overlay>
        )}
        {screen === 'paused' && (
          <Overlay>
            <Text style={styles.title}>PAUSED</Text>
            <Button label="RESUME" onPress={() => setScreen('playing')} />
            <Button label="QUIT" secondary onPress={() => setScreen('menu')} />
          </Overlay>
        )}
        {screen === 'over' && (
          <Overlay>
            <Text style={styles.title}>GAME OVER</Text>
            <Text style={styles.final}>{g.score}</Text>
            <Text style={styles.best}>
              {newBest ? '🎉 New best!' : `Best: ${best}`}
            </Text>
            <Button label="PLAY AGAIN" onPress={start} />
            <Button label="MENU" secondary onPress={() => setScreen('menu')} />
          </Overlay>
        )}
      </View>
    </View>
  );
}

function Overlay({ children }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Button({ label, onPress, secondary }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const GOLD = '#F5C542';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0b1e', alignItems: 'center' },
  field: { flex: 1, overflow: 'hidden', backgroundColor: '#1a1538' },
  lane: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#1a1538' },
  laneAlt: { backgroundColor: '#211b45' },
  laneActive: { backgroundColor: '#2c2460' },
  item: { position: 'absolute', textAlign: 'center' },
  pop: {
    position: 'absolute',
    textAlign: 'center',
    color: GOLD,
    fontSize: 22,
    fontWeight: '800',
  },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#ff2d55' },
  touchRow: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  touchZone: { flex: 1 },
  hud: { position: 'absolute', top: 0, left: 0, right: 0 },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hudText: { fontSize: 18, minWidth: 90 },
  score: { color: '#fff', fontSize: 34, fontWeight: '900' },
  pauseBtn: { minWidth: 90, alignItems: 'flex-end' },
  pauseText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  combo: { color: GOLD, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,20,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: { width: '100%', maxWidth: 360, alignItems: 'center' },
  title: { color: GOLD, fontSize: 40, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: { color: '#c9c2ff', fontSize: 16, marginTop: 4, marginBottom: 20 },
  rules: { marginBottom: 24, alignItems: 'center' },
  rule: { color: '#fff', fontSize: 15, marginVertical: 4, textAlign: 'center' },
  final: { color: '#fff', fontSize: 64, fontWeight: '900', marginVertical: 4 },
  best: { color: '#c9c2ff', fontSize: 16, marginTop: 12, marginBottom: 8 },
  button: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#5b4fb3' },
  buttonText: { color: '#1a1538', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  buttonTextSecondary: { color: '#fff' },
});
