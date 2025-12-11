import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';

const randRange = (a, b) => Math.random() * (b - a) + a;

// 効果音システム
const playSoundEffect = async (type) => {
  try {
    await Tone.start();
    const now = Tone.now();
    
    switch(type) {
      case 'attack':
        const synthAttack = new Tone.MembraneSynth().toDestination();
        synthAttack.triggerAttackRelease('C2', '0.1', now);
        break;
      case 'damage':
        const synthDamage = new Tone.Synth().toDestination();
        synthDamage.triggerAttackRelease('G2', '0.05', now);
        break;
      case 'critical':
        const synthCrit = new Tone.Synth().toDestination();
        synthCrit.triggerAttackRelease('C5', '0.1', now);
        synthCrit.triggerAttackRelease('E5', '0.1', now + 0.05);
        synthCrit.triggerAttackRelease('G5', '0.1', now + 0.1);
        break;
      case 'heal':
        const synthHeal = new Tone.Synth().toDestination();
        synthHeal.triggerAttackRelease('C5', '0.15', now);
        synthHeal.triggerAttackRelease('E5', '0.15', now + 0.1);
        break;
      case 'skill':
        const synthSkill = new Tone.Synth().toDestination();
        synthSkill.triggerAttackRelease('A4', '0.2', now);
        break;
      case 'win':
        const synthWin = new Tone.Synth().toDestination();
        synthWin.triggerAttackRelease('C4', '0.2', now);
        synthWin.triggerAttackRelease('E4', '0.2', now + 0.15);
        synthWin.triggerAttackRelease('G4', '0.2', now + 0.3);
        synthWin.triggerAttackRelease('C5', '0.3', now + 0.45);
        break;
      case 'coin':
        const synthCoin = new Tone.Synth().toDestination();
        synthCoin.triggerAttackRelease('E5', '0.1', now);
        synthCoin.triggerAttackRelease('C5', '0.1', now + 0.05);
        break;
      case 'lose':
        const synthLose = new Tone.Synth().toDestination();
        synthLose.triggerAttackRelease('C4', '0.3', now);
        synthLose.triggerAttackRelease('G3', '0.3', now + 0.15);
        synthLose.triggerAttackRelease('E3', '0.5', now + 0.3);
        break;
      case 'start':
        const synthStart = new Tone.Synth().toDestination();
        synthStart.triggerAttackRelease('G4', '0.1', now);
        synthStart.triggerAttackRelease('G4', '0.1', now + 0.12);
        synthStart.triggerAttackRelease('C5', '0.2', now + 0.24);
        break;
    }
  } catch (e) {
    console.log('Audio not available');
  }
};

const gearPool = [
  { name: '強剣', power: 6, emoji: '⚔️' },
  { name: '鋭矛', power: 5, emoji: '🔱' },
  { name: '革鎧', power: 3, emoji: '🛡️' },
  { name: '木の盾', power: 1, emoji: '🪵' },
  { name: '古びた短剣', power: 0.5, emoji: '🗡️' },
  { name: '伝説の兜', power: 8, emoji: '👑' },
  { name: '何もなし', power: 0, emoji: '❌' },
];

const skillPool = [
  { name: '連撃', effect: 'double', emoji: '⚡', chance: 0.15 },
  { name: '回復', effect: 'heal', emoji: '💚', chance: 0.1 },
  { name: '防御', effect: 'shield', emoji: '🛡️', chance: 0.12 },
  { name: '必殺', effect: 'critical', emoji: '💥', chance: 0.08 },
];

const GRID_SIZE = 4;
const CELL_PX = 80;

const COLORS = {
  A: { bg: 'bg-red-600', ring: 'ring-red-400' },
  B: { bg: 'bg-blue-600', ring: 'ring-blue-400' },
  C: { bg: 'bg-green-600', ring: 'ring-green-400' },
  D: { bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
};

export default function App() {
  const [chars, setChars] = useState([]);
  const [bet, setBet] = useState(null);
  const [betAmount, setBetAmount] = useState(100);
  const [money, setMoney] = useState(1000);
  const [result, setResult] = useState(null);
  const [isBattleRunning, setIsBattleRunning] = useState(false);
  const [timer, setTimer] = useState(15);
  const [battleLog, setBattleLog] = useState([]);
  const [effects, setEffects] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, profit: 0, streak: 0 });
  const [history, setHistory] = useState([]);
  const logRef = useRef(null);

  const addLog = (msg) => {
    setBattleLog(prev => [...prev.slice(-8), { msg, time: Date.now() }]);
  };

  const addEffect = (pos, type, text) => {
    const id = Date.now() + Math.random();
    setEffects(prev => [...prev, { id, pos, type, text }]);
    setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), 1000);
    
    if (type === 'damage') playSoundEffect('damage');
    if (type === 'heal') playSoundEffect('heal');
    if (type === 'skill') playSoundEffect('skill');
  };

  const generateMatch = () => {
    let usedPositions = new Set();

    const baseChars = ['A', 'B', 'C', 'D'].map((id) => {
      let pos;
      do {
        pos = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
      } while (usedPositions.has(pos));
      usedPositions.add(pos);

      const base = randRange(8, 12);
      const nGear = Math.floor(randRange(1, 4));
      const gear = Array.from({ length: nGear }, () =>
        gearPool[Math.floor(Math.random() * gearPool.length)]
      );
      const gearPower = gear.reduce((s, g) => s + g.power, 0);
      const total = base + gearPower;

      const skill = Math.random() > 0.3 ? skillPool[Math.floor(Math.random() * skillPool.length)] : null;

      return {
        id,
        base,
        gear,
        gearPower,
        total,
        hp: 100,
        maxHp: 100,
        pos,
        skill,
        shieldCount: 0,
      };
    });

    const totalSum = baseChars.reduce((s, c) => s + c.total, 0);
    const withRates = baseChars.map((c) => ({ ...c, winrate: c.total / totalSum }));
    const withOdds = withRates.map((c) => ({ ...c, odds: (1 / c.winrate) * 0.92 }));

    setChars(withOdds);
    setResult(null);
    setIsBattleRunning(false);
    setTimer(15);
    setBet(null);
    setBattleLog([]);
    setEffects([]);
  };

  const getNeighbors = (pos) => {
    const neighbors = [];
    const x = pos % GRID_SIZE;
    const y = Math.floor(pos / GRID_SIZE);

    if (x > 0) neighbors.push(pos - 1);
    if (x < GRID_SIZE - 1) neighbors.push(pos + 1);
    if (y > 0) neighbors.push(pos - GRID_SIZE);
    if (y < GRID_SIZE - 1) neighbors.push(pos + GRID_SIZE);

    return neighbors;
  };

  useEffect(() => {
    if (!isBattleRunning) return;

    const tickMs = 550;
    const iv = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));

      setChars((prev) => {
        const updated = prev.map((p) => ({ ...p }));

        for (let i = 0; i < updated.length; i++) {
          const me = updated[i];
          if (me.hp <= 0) continue;

          const neighborsPos = getNeighbors(me.pos);
          const adjacent = updated.find(
            (o) => o.id !== me.id && neighborsPos.includes(o.pos) && o.hp > 0
          );

          if (adjacent) {
            const denom = me.gearPower + adjacent.gearPower + 1;
            const hitChance = denom > 0 ? me.gearPower / denom : 0.5;
            const hit = Math.random() < hitChance;

            let skillActivated = false;
            if (me.skill && Math.random() < me.skill.chance) {
              skillActivated = true;
              addLog(`${me.id}が${me.skill.emoji}${me.skill.name}を発動！`);
              addEffect(me.pos, 'skill', me.skill.emoji);
            }

            if (hit) {
              let dmg = Math.floor(randRange(10, 25));
              
              if (skillActivated) {
                if (me.skill.effect === 'double') {
                  dmg *= 2;
                  addLog(`${me.id}の連撃！ダメージ2倍！`);
                  playSoundEffect('attack');
                } else if (me.skill.effect === 'critical') {
                  dmg = Math.floor(dmg * 2.5);
                  addLog(`${me.id}の必殺技！大ダメージ！`);
                  playSoundEffect('critical');
                }
              } else {
                playSoundEffect('attack');
              }

              if (adjacent.shieldCount > 0) {
                dmg = Math.floor(dmg * 0.5);
                adjacent.shieldCount--;
                addLog(`${adjacent.id}の防御で半減！`);
              }

              adjacent.hp = Math.max(0, adjacent.hp - dmg);
              addLog(`${me.id}が${adjacent.id}に${dmg}ダメージ！`);
              addEffect(adjacent.pos, 'damage', `-${dmg}`);
            } else {
              let dmg = Math.floor(randRange(5, 15));
              
              if (me.shieldCount > 0) {
                dmg = Math.floor(dmg * 0.5);
                me.shieldCount--;
              }
              
              me.hp = Math.max(0, me.hp - dmg);
              addLog(`${adjacent.id}が反撃！${me.id}に${dmg}ダメージ！`);
              addEffect(me.pos, 'damage', `-${dmg}`);
            }

            if (skillActivated) {
              if (me.skill.effect === 'heal') {
                const heal = 20;
                me.hp = Math.min(me.maxHp, me.hp + heal);
                addLog(`${me.id}がHP回復！`);
                addEffect(me.pos, 'heal', `+${heal}`);
              } else if (me.skill.effect === 'shield') {
                me.shieldCount = 2;
                addLog(`${me.id}が防御態勢！`);
              }
            }
          } else {
            const moves = neighborsPos;
            if (moves.length > 0) {
              me.pos = moves[Math.floor(Math.random() * moves.length)];
            }
          }
        }

        return updated;
      });
    }, tickMs);

    return () => clearInterval(iv);
  }, [isBattleRunning]);

  useEffect(() => {
    if (!isBattleRunning) return;

    const alive = chars.filter((c) => c.hp > 0);
    if (alive.length === 1) {
      const winner = alive[0];
      const isHit = bet === winner.id;
      const payout = isHit ? Math.floor(betAmount * winner.odds) : 0;
      
      setResult({ winner, isHit, payout });
      setIsBattleRunning(false);
      
      if (isHit) {
        playSoundEffect('win');
        setTimeout(() => playSoundEffect('coin'), 500);
        setMoney(m => m + payout);
        setStats(s => ({ 
          wins: s.wins + 1, 
          losses: s.losses,
          profit: s.profit + payout - betAmount,
          streak: s.streak + 1
        }));
      } else {
        playSoundEffect('lose');
        setStats(s => ({ 
          wins: s.wins, 
          losses: s.losses + 1,
          profit: s.profit - betAmount,
          streak: 0
        }));
      }
      
      setHistory(h => [...h, { char: winner.id, isHit }].slice(-20));
      addLog(`🏆 ${winner.id}の勝利！`);
      return;
    }

    if (timer <= 0 && chars.length > 0) {
      const winner = [...chars].sort((a, b) => b.hp - a.hp)[0];
      const isHit = bet === winner.id;
      const payout = isHit ? Math.floor(betAmount * winner.odds) : 0;
      
      setResult({ winner, isHit, payout });
      setIsBattleRunning(false);
      
      if (isHit) {
        playSoundEffect('win');
        setTimeout(() => playSoundEffect('coin'), 500);
        setMoney(m => m + payout);
        setStats(s => ({ 
          wins: s.wins + 1, 
          losses: s.losses,
          profit: s.profit + payout - betAmount,
          streak: s.streak + 1
        }));
      } else {
        playSoundEffect('lose');
        setStats(s => ({ 
          wins: s.wins, 
          losses: s.losses + 1,
          profit: s.profit - betAmount,
          streak: 0
        }));
      }
      
      setHistory(h => [...h, { char: winner.id, isHit }].slice(-20));
      addLog(`⏰ 時間切れ！${winner.id}の勝利！`);
    }
  }, [chars, timer, isBattleRunning, bet, betAmount]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  const startBattle = () => {
    if (!bet || betAmount > money) return;
    setMoney(m => m - betAmount);
    setIsBattleRunning(true);
    addLog(`🎲 バトル開始！${bet}に${betAmount}円賭けた！`);
    playSoundEffect('start');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-2xl shadow-2xl">
        <h1 className="text-4xl font-bold text-center">⚔️ 棒人間バトルアリーナ 💰</h1>
        <p className="text-center mt-2 text-purple-100">最強の戦士に賭けろ！</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-600 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold">💰 {money}円</div>
          <div className="text-sm opacity-80">所持金</div>
        </div>
        <div className="bg-blue-600 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold">🏆 {stats.wins}勝</div>
          <div className="text-sm opacity-80">勝利数</div>
        </div>
        <div className="bg-red-600 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold">💔 {stats.losses}敗</div>
          <div className="text-sm opacity-80">敗北数</div>
        </div>
        <div className={`${stats.profit >= 0 ? 'bg-yellow-500' : 'bg-gray-600'} p-4 rounded-xl text-center`}>
          <div className="text-3xl font-bold">{stats.profit >= 0 ? '📈' : '📉'} {stats.profit}円</div>
          <div className="text-sm opacity-80">総収支</div>
        </div>
      </div>

      {stats.streak >= 3 && (
        <motion.div 
          className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl text-center font-bold text-black"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          🔥 {stats.streak}連勝中！ FEVER TIME 🔥
        </motion.div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button 
          onClick={generateMatch} 
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:scale-105 transition shadow-lg"
        >
          🎲 新しい試合を生成
        </button>

        {chars.length > 0 && !isBattleRunning && !result && bet && (
          <button
            onClick={startBattle}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:scale-105 transition shadow-lg disabled:opacity-50"
            disabled={!bet || betAmount > money}
          >
            ⚔️ バトル開始！
          </button>
        )}

        {isBattleRunning && (
          <div className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold text-xl animate-pulse">
            ⏱️ 残り {timer}秒
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {chars.length > 0 && !isBattleRunning && !result && (
            <>
              <div className="bg-slate-700 p-4 rounded-xl">
                <h3 className="font-bold text-xl mb-3">💰 賭け金を設定</h3>
                <div className="flex gap-2 flex-wrap">
                  {[50, 100, 200, 500, 1000].map(v => (
                    <button
                      key={v}
                      onClick={() => setBetAmount(v)}
                      className={`px-4 py-2 rounded-lg font-bold ${betAmount === v ? 'bg-yellow-500 text-black' : 'bg-slate-600'}`}
                      disabled={v > money}
                    >
                      {v}円
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="range"
                    min="10"
                    max={money}
                    step="10"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center font-bold text-2xl mt-2">{betAmount}円</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {chars.map((c) => (
                  <motion.div
                    key={c.id}
                    className={`border-2 p-4 rounded-xl cursor-pointer transition ${
                      bet === c.id ? 'bg-yellow-500 text-black border-yellow-300 scale-105' : 'bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setBet(c.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 rounded-full ${COLORS[c.id].bg}`}></div>
                      <div className="font-bold text-2xl">キャラ {c.id}</div>
                      <div className="text-2xl font-bold text-yellow-400">{c.odds.toFixed(2)}倍</div>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div>🎒 装備: {c.gear.map(g => g.emoji).join(' ')}</div>
                      {c.skill && (
                        <div className="bg-purple-600 text-white px-2 py-1 rounded inline-block">
                          {c.skill.emoji} {c.skill.name}
                        </div>
                      )}
                      <div>⚡ 戦力: {c.total.toFixed(1)}</div>
                      <div>📊 勝率: {(c.winrate * 100).toFixed(1)}%</div>
                      {bet === c.id && (
                        <div className="mt-2 text-lg font-bold">
                          💰 配当: {Math.floor(betAmount * c.odds)}円
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {chars.length > 0 && (
            <div className="bg-slate-700 p-4 rounded-xl">
              <h3 className="font-bold text-xl mb-3">⚔️ バトルフィールド</h3>
              <div
                className="grid grid-cols-4 gap-1 bg-slate-900 p-2 rounded-xl relative"
                style={{ width: GRID_SIZE * CELL_PX + 20 }}
              >
                {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => {
                  const charAtPos = chars.find(c => c.pos === i && c.hp > 0);
                  const isBetChar = charAtPos && bet === charAtPos.id;
                  
                  return (
                    <div 
                      key={i} 
                      className={`w-20 h-20 rounded-md relative transition-all ${
                        isBetChar
                          ? 'bg-yellow-300 border-4 border-yellow-400 shadow-xl shadow-yellow-500/70' 
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {chars
                        .filter((c) => c.pos === i && c.hp > 0)
                        .map((c) => {
                          const isMyBet = bet === c.id;
                          return (
                            <div key={c.id} className="absolute inset-0 flex flex-col items-center justify-center">
                              {isMyBet && (
                                <motion.div
                                  className="absolute inset-0 bg-yellow-400 opacity-30 rounded-md"
                                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                                  transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                              )}
                              <motion.div
                                className={`${isMyBet ? 'w-14 h-14' : 'w-10 h-10'} rounded-full ${COLORS[c.id].bg} ${isMyBet ? 'ring-8 ring-yellow-300 shadow-2xl shadow-yellow-400/80' : `ring-4 ${COLORS[c.id].ring}`} flex items-center justify-center ${isMyBet ? 'text-3xl' : 'text-xl'} shadow-lg relative z-10`}
                                animate={isMyBet ? { scale: [1, 1.25, 1] } : { scale: [1, 1.1, 1] }}
                                transition={isMyBet ? { repeat: Infinity, duration: 0.6 } : { repeat: Infinity, duration: 1.2 }}
                              >
                                {isMyBet && (
                                  <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="drop-shadow-[0_0_8px_rgba(255,255,0,0.8)]"
                                  >
                                    ⭐
                                  </motion.span>
                                )}
                              </motion.div>
                              {c.shieldCount > 0 && (
                                <div className="absolute -top-1 -right-1 text-xl z-20">🛡️</div>
                              )}
                              <div className="w-full bg-slate-600 h-2 mt-1 rounded-full overflow-hidden relative z-10">
                                <motion.div
                                  className={COLORS[c.id].bg}
                                  style={{ width: `${c.hp}%` }}
                                  initial={{ width: `${c.hp}%` }}
                                  animate={{ width: `${c.hp}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                              <div className="text-xs font-bold mt-0.5 relative z-10">{Math.floor(c.hp)}</div>
                            </div>
                          );
                        })}
                    
                      <AnimatePresence>
                        {effects.filter(e => e.pos === i).map(e => (
                          <motion.div
                            key={e.id}
                            className={`absolute inset-0 flex items-center justify-center font-bold text-xl pointer-events-none ${
                              e.type === 'damage' ? 'text-red-400' : e.type === 'heal' ? 'text-green-400' : 'text-yellow-400'
                            }`}
                            initial={{ opacity: 1, y: 0 }}
                            animate={{ opacity: 0, y: -30 }}
                            exit={{ opacity: 0 }}
                          >
                            {e.text}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700 p-4 rounded-xl h-80">
            <h3 className="font-bold text-lg mb-2">📜 バトルログ</h3>
            <div ref={logRef} className="space-y-1 overflow-y-auto h-64 text-sm">
              {battleLog.map((log) => (
                <motion.div
                  key={log.time}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800 px-2 py-1 rounded"
                >
                  {log.msg}
                </motion.div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="bg-slate-700 p-4 rounded-xl">
              <h3 className="font-bold text-lg mb-2">📊 直近の戦績</h3>
              <div className="flex flex-wrap gap-1">
                {history.slice(-15).map((h, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      h.isHit ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {h.char}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl border-4 ${
              result.isHit ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300' : 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300'
            }`}
          >
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold">
                {result.isHit ? '🎉 的中！おめでとう！ 🎉' : '😢 残念...外れました'}
              </div>
              
              <div className="text-2xl">
                勝者: <span className="font-bold">キャラ {result.winner.id}</span>
              </div>
              
              {result.isHit && (
                <div className="text-3xl font-bold text-yellow-300">
                  💰 +{result.payout}円獲得！
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-black bg-opacity-30 p-3 rounded-xl">
                  <div className="font-bold mb-2">勝者の情報</div>
                  <div>🎒 {result.winner.gear.map(g => g.emoji).join(' ')}</div>
                  {result.winner.skill && <div>✨ {result.winner.skill.emoji} {result.winner.skill.name}</div>}
                  <div>❤️ 残りHP: {Math.floor(result.winner.hp)}</div>
                  <div>💰 オッズ: {result.winner.odds.toFixed(2)}倍</div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      generateMatch();
                    }}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition"
                  >
                    🎲 次の試合
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setChars([]);
                      setBet(null);
                    }}
                    className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-xl font-bold transition"
                  >
                    ⏸️ 待機
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}