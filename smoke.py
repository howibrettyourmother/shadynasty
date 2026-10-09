# Smoke pass: every tab renders with real Sleeper data on an iPhone 13 viewport, no JS errors. Usage: python3 smoke.py [BASE]
import asyncio,sys,time
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:18802/index.html'
TABS=['home','fleece','tank']
async def main():
  ok=True
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome');d=dict(p.devices['iPhone 13']);d.pop('default_browser_type',None)
    c=await b.new_context(**d);m=await c.new_page();errs=[]
    m.on('pageerror',lambda e:errs.append(str(e)));m.on('console',lambda x:x.type=='error' and errs.append(x.text))
    await m.goto(BASE+'#home')
    for t in TABS:
      t0=time.time();await m.evaluate(f"location.hash='#{t}'")
      try:await m.wait_for_function("!document.querySelector('#view .spin')&&document.querySelector('#view .panel')&&!/fumbled/.test(document.getElementById('view').textContent)",timeout=240000);good=True
      except Exception as e:good=False
      txt=await m.inner_text('#view');xo=await m.evaluate("document.documentElement.scrollWidth-innerWidth")
      bad=[w for w in ['undefined','NaN','{T}','{W}','[object'] if w in txt]
      print(('PASS ' if good and xo<=1 and not bad else 'FAIL ')+t,f'{time.time()-t0:.1f}s',len(txt),'chars xo',xo,bad,'' if good else txt[:200].replace('\n',' '))
      ok&=good and xo<=1 and not bad
      await m.wait_for_timeout(500);await m.screenshot(path=f'/workspace/tankshots/sn3-{t.replace("/","-")}.png')
    print('errors',errs[:5]);ok&=not errs
    await b.close()
  print('ALL PASS' if ok else 'SOME FAIL')
asyncio.run(main())
