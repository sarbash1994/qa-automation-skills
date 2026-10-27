"""Routing eval: which skill does Claude invoke first for each query? Runs claude -p in a clean
project that has the six qa skills installed, stops at the first Skill call, after 3 other tool
calls, or at the end of the first answer."""
import json, os, subprocess, sys, time, select
from concurrent.futures import ThreadPoolExecutor
D = os.path.dirname(os.path.abspath(__file__)); PROJECT = os.path.abspath(sys.argv[3]) if len(sys.argv) > 3 else os.path.join(D, 'project')
MODEL = sys.argv[1]; REPEATS = int(sys.argv[2]); OUT = os.path.join(D, 'results', 'routing.json'); os.makedirs(os.path.dirname(OUT), exist_ok=True)

def one(query):
    env = {k: v for k, v in os.environ.items() if k != 'CLAUDECODE'}
    cmd = ['claude', '-p', query, '--model', MODEL, '--output-format', 'stream-json', '--verbose', '--max-turns', '4']
    p = subprocess.Popen(cmd, cwd=PROJECT, env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    tools, skill, buf, t0 = [], None, b'', time.time()
    try:
        while time.time() - t0 < 180:
            if p.poll() is not None:
                buf += p.stdout.read() or b''
            elif select.select([p.stdout], [], [], 1.0)[0]:
                chunk = os.read(p.stdout.fileno(), 65536)
                if chunk: buf += chunk
            lines = buf.split(b'\n'); buf = lines.pop()
            for line in lines:
                try: ev = json.loads(line)
                except Exception: continue
                if ev.get('type') == 'assistant':
                    for c in ev.get('message', {}).get('content', []):
                        if c.get('type') == 'tool_use':
                            tools.append(c.get('name'))
                            if c.get('name') == 'Skill' and skill is None:
                                skill = (c.get('input') or {}).get('skill') or (c.get('input') or {}).get('command')
                if ev.get('type') == 'result': return skill, tools
            if skill or len(tools) >= 4 or (p.poll() is not None and not buf): break
        return skill, tools
    finally:
        if p.poll() is None: p.kill()

def main():
    qs = json.load(open(os.path.join(D, 'queries.json')))
    jobs = [(i, r) for i in range(len(qs)) for r in range(REPEATS)]
    res = {}
    with ThreadPoolExecutor(max_workers=6) as ex:
        for (i, r), (skill, tools) in zip(jobs, ex.map(lambda j: one(qs[j[0]]['q']), jobs)):
            res.setdefault(i, []).append({'skill': skill, 'tools': tools})
            print(f'q{i:02d} r{r} -> {skill} {tools[:4]}', flush=True)
    out = []
    for i, q in enumerate(qs):
        got = [ (x['skill'] or 'none').split(':')[-1] if (x['skill'] or '').split(':')[-1].startswith('qa-') or not x['skill'] else 'other:' + x['skill'] for x in res[i] ]
        ok = [g in q['expect'] or (g.startswith('other:') and 'none' in q['expect']) for g in got]
        out.append({**q, 'got': got, 'pass': sum(ok), 'runs': len(got), 'raw': res[i]})
    json.dump(out, open(OUT, 'w'), indent=2, ensure_ascii=False)
    print('PASS', sum(o['pass'] for o in out), '/', sum(o['runs'] for o in out))
main()
