"""
Genera la voz en off de cada escena con voces neuronales (edge-tts) y guarda
las marcas de tiempo de cada palabra para sincronizar las animaciones.

Uso:  python3 voz.py guia      |  python3 voz.py brokers
(Requiere conexión a internet. Solo regenera las escenas cuyo texto cambió.)
"""
import asyncio
import hashlib
import importlib
import json
import os
import sys

import edge_tts

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)


async def gen(text, voice, rate, pitch, mp3, js):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append([ch["offset"] / 1e7, ch["duration"] / 1e7, ch["text"]])
    with open(js, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=0)


async def main(name):
    mod = importlib.import_module(f"escenas_{name}")
    out = os.path.join(BASE, "build", name, "voz")
    os.makedirs(out, exist_ok=True)
    for sc in mod.escenas():
        if not sc.text:
            continue
        mp3 = os.path.join(out, f"{sc.sid}.mp3")
        js = os.path.join(out, f"{sc.sid}.json")
        hf = os.path.join(out, f"{sc.sid}.hash")
        h = hashlib.md5((mod.VOZ + mod.RATE + mod.PITCH + sc.text).encode()).hexdigest()
        if os.path.exists(mp3) and os.path.exists(hf) and open(hf).read() == h:
            print(f"  = {sc.sid} (sin cambios)")
            continue
        print(f"  ♪ {sc.sid}: {sc.text[:70]}…")
        ok = False
        for intento in range(6):
            try:
                await asyncio.wait_for(gen(sc.text, mod.VOZ, mod.RATE, mod.PITCH, mp3, js), timeout=45)
                ok = os.path.getsize(mp3) > 1000
                if ok:
                    break
            except Exception as e:  # reintento ante cortes de red
                print("    reintento:", e)
            await asyncio.sleep(3 + 2 * intento)
        if ok:
            with open(hf, "w") as f:
                f.write(h)
        else:
            print(f"    ✗ {sc.sid} falló; vuelve a ejecutar voz.py")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
