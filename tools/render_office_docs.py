import asyncio,os
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome');pg=await b.new_page(viewport={'width':900,'height':1000})
    for n in [d['file'] for d in __import__('json').load(open('office/office.json'))['docs']]:
      await pg.goto('file://'+os.path.abspath(f'office/docs/{n}.html'));await pg.screenshot(path=f'office/docs/{n}.png',full_page=True);await pg.pdf(path=f'office/docs/{n}.pdf',format='Letter')
    await b.close()
asyncio.run(main())
