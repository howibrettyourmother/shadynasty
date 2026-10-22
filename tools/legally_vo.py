#!/usr/bin/env python3
"""Pre-render LESSHOUSE voice lines (arcade/legally/lines.js) to arcade/legally/vo/ with edge-tts.
Judge lines use en-US-GuyNeural, Joe's pose lines a brighter neural voice. vo/index.json maps line text -> file.
Only missing clips render; orphans are deleted."""
import asyncio, hashlib, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); GAME = os.path.join(ROOT, 'arcade/legally'); VO = os.path.join(GAME, 'vo')
JUDGE = ('en-US-GuyNeural', '+8%', '-6Hz'); JOE = ('en-US-ChristopherNeural', '+10%', '+0Hz'); LAWYER = ('en-US-EricNeural', '+6%', '+4Hz')
js = subprocess.run(['node', '-e', "global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8'));console.log(JSON.stringify(window.LH_LINES))", os.path.join(GAME, 'lines.js')], capture_output=True, text=True, check=True)
L = json.loads(js.stdout); want = {}
for cat, arr in L.items():
    v = JOE if cat == 'joe' else LAWYER if cat == 'lawyer' else JUDGE
    for t in arr: want[t] = v
fn = lambda t, v: hashlib.sha1(('%s|%s|%s|%s' % (*v, t)).encode()).hexdigest()[:12] + '.mp3'
os.makedirs(VO, exist_ok=True)
keys = {t: fn(t, v) for t, v in want.items()}
todo = [(t, f) for t, f in keys.items() if not os.path.exists(os.path.join(VO, f))]
async def main():
    import edge_tts
    sem = asyncio.Semaphore(5); bad = []
    async def one(t, f):
        v = want[t]
        async with sem:
            for _ in range(3):
                try:
                    tmp = os.path.join(VO, f + '.raw.mp3'); await edge_tts.Communicate(t, v[0], rate=v[1], pitch=v[2]).save(tmp)
                    trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse'
                    p = await asyncio.create_subprocess_exec('ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-af', trim, '-ac', '1', '-ar', '24000', '-b:a', '48k', os.path.join(VO, f)); await p.wait(); os.remove(tmp)
                    if os.path.getsize(os.path.join(VO, f)) > 500: return
                except Exception: pass
                await asyncio.sleep(2)
            bad.append(f)
    await asyncio.gather(*(one(t, f) for t, f in todo)); return bad
bad = asyncio.run(main()) if todo else []
keys = {t: f for t, f in keys.items() if f not in bad}
for f in os.listdir(VO):
    if f.endswith('.mp3') and f not in keys.values(): os.remove(os.path.join(VO, f))
json.dump({'n': len(keys), 'keys': keys}, open(os.path.join(VO, 'index.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print('lesshouse vo: %d lines, %d rendered, %d failed' % (len(keys), len(todo), len(bad)))
