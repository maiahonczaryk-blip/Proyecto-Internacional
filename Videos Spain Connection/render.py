"""
Renderiza el vídeo final: animación (multiproceso) + voz en off + música.

Uso:
  python3 render.py guia                 -> vídeo completo
  python3 render.py brokers
  python3 render.py guia --preview       -> fotogramas de control (PNG) por escena
"""
import importlib
import json
import math
import os
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
import motor  # noqa: E402
from motor import FPS, H, LEAD, TRANS, W, Timeline  # noqa: E402

SALIDA = os.path.join(BASE, "salida")


def dur_audio(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                        "default=nw=1:nk=1", path], capture_output=True, text=True)
    return float(r.stdout.strip())


def build(name):
    mod = importlib.import_module(f"escenas_{name}")
    scenes = mod.escenas()
    vdir = os.path.join(BASE, "build", name, "voz")
    pages = sum(1 for s in scenes if s.page)
    for s in scenes:
        if s.text:
            words = json.load(open(os.path.join(vdir, f"{s.sid}.json"), encoding="utf-8"))
            vd = dur_audio(os.path.join(vdir, f"{s.sid}.mp3"))
        else:
            words, vd = [], s.hold
        s.voice_dur = vd
        s.setup(words, vd, pages)
    return mod, scenes, Timeline(scenes)


LAB_IDS = {
    "overview_en": "what-is-the-spain-connection",
    "guide_en": "buyers-guide",
    "brokers_en": "broker-presentation",
    "realtor_en": "realtor-presentation",
    "ambassador_en": "ambassador-presentation",
    # Versiones en español (mismo id + sufijo "-es")
    "overview_es": "what-is-the-spain-connection-es",
    "guide_es": "buyers-guide-es",
    "brokers_es": "broker-presentation-es",
    "realtor_es": "realtor-presentation-es",
    "ambassador_es": "ambassador-presentation-es",
}
LAB_DIR = os.path.join(motor.ROOT, "videos")


def worker(args):
    name, f0, f1, out, lab = args[:5]
    motor.LAB_MODE = lab
    _, _, tl = build(name)
    enc = (["-preset", "medium", "-crf", "21", "-bf", "0", "-g", "60", "-keyint_min", "60", "-sc_threshold", "0"]
           if lab else ["-preset", "medium", "-crf", "17"])
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264"] + enc + [
           "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", str(FPS), out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(tl.frame(f / FPS).tobytes())
    p.stdin.close()
    p.wait()
    return out


def preview(name):
    _, scenes, tl = build(name)
    d = os.path.join(BASE, "build", name, "preview")
    os.makedirs(d, exist_ok=True)
    for i, s in enumerate(scenes):
        t = tl.starts[i] + s.dur - 0.3
        tl.frame(t).save(os.path.join(d, f"{s.sid}.jpg"), quality=85)
        if len(sys.argv) > 3 and sys.argv[3] == "--mid":
            tl.frame(tl.starts[i] + s.dur * 0.45).save(os.path.join(d, f"{s.sid}_mid.jpg"), quality=85)
    print("vista previa en", d, "· duración total %.1fs" % tl.total)


def mezclar_audio(name, mod, scenes, tl, wav_out):
    bdir = os.path.join(BASE, "build", name)
    musica = os.path.join(bdir, "musica.wav")
    exe = os.path.join(BASE, "build", "musica")
    if not os.path.exists(exe):
        subprocess.run(["clang", "-O2", "-o", exe, os.path.join(BASE, "musica.c"), "-lm"], check=True)
    subprocess.run([exe, f"{tl.total + 0.5:.2f}", musica, mod.ESTILO_MUSICA], check=True)
    inputs = ["-i", musica]
    filt = []
    labels = []
    k = 1
    for s, st in zip(scenes, tl.starts):
        if not s.text:
            continue
        inputs += ["-i", os.path.join(bdir, "voz", f"{s.sid}.mp3")]
        ms = int((st + motor.LEAD) * 1000)
        filt.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}:all=1[v{k}]")
        labels.append(f"[v{k}]")
        k += 1
    filt.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:dropout_transition=0,volume=1.5,"
                f"apad=whole_dur={tl.total + 0.5:.2f}[vo]")
    filt.append("[vo]asplit=2[vsc][vmx]")
    filt.append(f"[0:a]aresample=48000,volume={mod.VOL_MUSICA}[mus]")
    filt.append("[mus][vsc]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=700[mduck]")
    filt.append("[vmx][mduck]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[out]")
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + inputs + ["-filter_complex", ";".join(filt), "-map", "[out]",
                                                            "-t", f"{tl.total:.3f}", wav_out]
    subprocess.run(cmd, check=True)


def lab_metadata(name, scenes, tl):
    """Datos para superponer la tarjeta de contacto personalizada en el navegador."""
    for i, sc in enumerate(scenes):
        for el in sc.els:
            if el.contact:
                return {
                    "id": LAB_IDS[name], "width": W, "height": H, "fps": FPS, "duration": round(tl.total, 3),
                    "card": {"x": el.x, "y": el.y, "w": el.w, "h": el.h, "r": el.r,
                             "t0": round(tl.starts[i] + el.t0, 3), "animDur": el.dur, "dist": el.dist},
                    "sceneEnd": round(tl.starts[i] + sc.dur, 3),
                    "wipe": {"trans": motor.TRANS, "skew": 300, "ext": 460},
                }
    return None


def mux(name, mod, scenes, tl, lab=False):
    bdir = os.path.join(BASE, "build", name)
    wav = os.path.join(bdir, "audio.wav")
    mezclar_audio(name, mod, scenes, tl, wav)
    if lab:
        os.makedirs(LAB_DIR, exist_ok=True)
        final = os.path.join(LAB_DIR, LAB_IDS[name] + ".mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(bdir, "video_lab.mp4"), "-i", wav,
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest",
                        final], check=True)
        meta = lab_metadata(name, scenes, tl)
        with open(os.path.join(LAB_DIR, LAB_IDS[name] + ".json"), "w") as f:
            json.dump(meta, f, indent=1)
        # póster: portada con el título ya revelado
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "4.5", "-i", final, "-frames:v", "1",
                        "-vf", "scale=960:-2", "-q:v", "4", os.path.join(LAB_DIR, LAB_IDS[name] + ".jpg")],
                       check=True)
        return final
    final = os.path.join(SALIDA, mod.ARCHIVO)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(bdir, "video.mp4"), "-i", wav,
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", final],
                   check=True)
    return final


def full(name, lab=False):
    t0 = time.time()
    motor.LAB_MODE = lab
    mod, scenes, tl = build(name)
    nframes = int(math.ceil(tl.total * FPS))
    print(f"▶ {name}: {len(scenes)} escenas · {tl.total:.1f}s · {nframes} fotogramas")
    bdir = os.path.join(BASE, "build", name)
    os.makedirs(bdir, exist_ok=True)
    os.makedirs(SALIDA, exist_ok=True)
    nw = max(2, (os.cpu_count() or 4) - 1)
    nchunks = nw * 2
    edges = [round(i * nframes / nchunks) for i in range(nchunks + 1)]
    jobs = [(name, edges[i], edges[i + 1], os.path.join(bdir, f"parte_{i:02d}.mp4"), lab) for i in range(nchunks)]
    with ProcessPoolExecutor(max_workers=nw) as ex:
        for i, _ in enumerate(ex.map(worker, jobs)):
            print(f"   parte {i + 1}/{nchunks} lista ({time.time() - t0:.0f}s)")
    lst = os.path.join(bdir, "partes.txt")
    with open(lst, "w") as f:
        for jb in jobs:
            f.write(f"file '{jb[3]}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
                    os.path.join(bdir, "video_lab.mp4" if lab else "video.mp4")], check=True)
    final = mux(name, mod, scenes, tl, lab)
    for jb in jobs:
        os.remove(jb[3])
    print(f"✅ {final}  ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    name = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2] == "--preview":
        preview(name)
    elif len(sys.argv) > 2 and sys.argv[2] == "--audio":
        m, sc, t = build(name)
        print("✅", mux(name, m, sc, t))
    elif len(sys.argv) > 2 and sys.argv[2] == "--lab":
        full(name, lab=True)
    else:
        full(name)
