"""
Motor de vídeo animado — The Spain Connection
------------------------------------------------
Renderiza escenas animadas (1920x1080 @ 30 fps) con la estética oficial de
The Spain Connection: fotografía mediterránea con velo azul marino, tarjetas
de cristal, acentos naranja sol / azul ola y transición de "olas" de marca.

Cada elemento puede aparecer sincronizado con una palabra concreta de la voz
en off (marcas de tiempo "WordBoundary" generadas por voz.py).
"""
import math
import os
import re
import unicodedata

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30
BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)

LEAD = 0.95   # silencio antes de que empiece la voz en cada escena (s)
TAIL = 0.95   # respiro tras la voz (s)
TRANS = 0.8   # duración de la transición de olas (s)
LAB_MODE = False  # True -> se omite la tarjeta de contacto (se superpone en el navegador)


def P(*parts):
    return os.path.join(ROOT, *parts)


# ---------------------------------------------------------------- paleta TSC
COL = {
    "orange": (254, 137, 51),     # Sol — Pantone 1575 C
    "orange_l": (255, 179, 122),
    "blue_l": (10, 137, 246),     # Ola superior — Pantone 2194 C
    "blue": (6, 114, 197),        # Ola inferior — Pantone 285 C
    "deep": (13, 75, 130),
    "navy": (37, 54, 74),
    "navy_d": (22, 48, 78),
    "ink": (12, 28, 48),
    "slate": (75, 90, 112),       # Tipografía — Pantone 4137 C
    "gray": (124, 139, 158),
    "line": (226, 236, 247),
    "ice": (241, 246, 252),
    "cream": (255, 252, 248),
    "white": (255, 255, 255),
    "green": (34, 160, 107),
    "red": (214, 69, 65),
}


def rgba(c, a=255):
    return (c[0], c[1], c[2], a)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def eo3(p):
    return 1 - (1 - p) ** 3


def eio(p):
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def eback(p, s=1.6):
    p -= 1
    return 1 + (s + 1) * p ** 3 + s * p ** 2


def lerp(a, b, p):
    return a + (b - a) * p


# ---------------------------------------------------------------- fuentes
FONT_SF = "/System/Library/Fonts/SFNS.ttf"
FONT_EMOJI = "/System/Library/Fonts/Apple Color Emoji.ttc"
_fc = {}


def font(size, w=400):
    k = (size, w)
    if k not in _fc:
        f = ImageFont.truetype(FONT_SF, size)
        try:
            f.set_variation_by_axes([100, min(96, max(17, size)), 400, w])
        except Exception:
            pass
        _fc[k] = f
    return _fc[k]


_emo = {}


def emoji_img(ch, size):
    k = (ch, size)
    if k not in _emo:
        f = ImageFont.truetype(FONT_EMOJI, 160)
        im = Image.new("RGBA", (480, 240), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
        bb = im.getbbox()
        if bb:
            im = im.crop(bb)
        r = size / max(im.height, im.width)
        im = im.resize((max(1, round(im.width * r)), max(1, round(im.height * r))), Image.LANCZOS)
        _emo[k] = im
    return _emo[k]


# ---------------------------------------------------------------- imágenes
_ic = {}


def load(path):
    if not os.path.isabs(path):
        path = P(path)
    if path not in _ic:
        _ic[path] = Image.open(path).convert("RGBA")
    return _ic[path]


def cover(img, w, h, fx=0.5, fy=0.5):
    r = max(w / img.width, h / img.height)
    im = img.resize((math.ceil(img.width * r), math.ceil(img.height * r)), Image.LANCZOS)
    x = int((im.width - w) * fx)
    y = int((im.height - h) * fy)
    return im.crop((x, y, x + w, y + h))


def contain(img, w, h):
    r = min(w / img.width, h / img.height)
    return img.resize((max(1, round(img.width * r)), max(1, round(img.height * r))), Image.LANCZOS)


def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return m


def shadow_img(w, h, r, pad, alpha=60, blur=22, color=(16, 34, 60)):
    s = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), rgba(color, 0))
    m = Image.new("L", s.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((pad, pad, pad + w, pad + h), r, fill=alpha)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    s.putalpha(m)
    return s


def paste(cv, im, x, y, op=1.0):
    if op <= 0.004 or im is None:
        return
    if op < 0.996:
        a = im.getchannel("A").point(lambda v: int(v * op))
        im = im.copy()
        im.putalpha(a)
    cv.paste(im, (int(round(x)), int(round(y))), im)


# ---------------------------------------------------------------- texto
def parse_rich(s):
    out = []
    for p in re.split(r"(\*[^*]+\*)", s):
        if not p:
            continue
        if p.startswith("*") and p.endswith("*") and len(p) > 1:
            out.append((p[1:-1], True))
        else:
            out.append((p, False))
    return out


def rich_lines(s, f, fh, maxw):
    lines = []
    for para in s.split("\n"):
        toks = []
        for txt, hl in parse_rich(para):
            for w in re.split(r"(\s+)", txt):
                if w:
                    toks.append((w, hl))
        line, lw = [], 0.0
        for w, hl in toks:
            ff = fh if hl else f
            wl = ff.getlength(w)
            if w.isspace():
                if line:
                    line.append((w, hl))
                    lw += wl
                continue
            if maxw and line and lw + wl > maxw:
                while line and line[-1][0].isspace():
                    line.pop()
                lines.append(line)
                line, lw = [], 0.0
            line.append((w, hl))
            lw += wl
        while line and line[-1][0].isspace():
            line.pop()
        lines.append(line)
    return lines


def line_len(line, f, fh):
    return sum((fh if hl else f).getlength(w) for w, hl in line)


def draw_rich_line(d, x, y_base, line, f, fh, color, hlc):
    for w, hl in line:
        ff = fh if hl else f
        d.text((x, y_base), w, font=ff, fill=hlc if hl else color, anchor="ls")
        x += ff.getlength(w)


def tracked_len(txt, f, track):
    return sum(f.getlength(c) for c in txt) + track * max(0, len(txt) - 1)


def draw_tracked(d, x, y_base, txt, f, fill, track):
    for c in txt:
        d.text((x, y_base), c, font=f, fill=fill, anchor="ls")
        x += f.getlength(c) + track
    return x


def text_block(text, size, weight, color, maxw=None, lh=1.3, hl=None, hlw=None, align="left", track=0):
    """Devuelve una imagen RGBA con el bloque de texto (con *resaltados*)."""
    f = font(size, weight)
    fh = font(size, hlw or max(weight, 700))
    hl = hl or color
    lines = rich_lines(text, f, fh, maxw)
    asc, desc = f.getmetrics()
    lhp = size * lh
    widths = [line_len(l, f, fh) for l in lines]
    wmax = int(max(widths + [1])) + 6
    if maxw and align != "left":
        wmax = max(wmax, int(maxw))
    hh = int(lhp * (len(lines) - 1) + asc + desc) + 4
    im = Image.new("RGBA", (wmax, hh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        x = 0
        if align == "center":
            x = (wmax - widths[i]) / 2
        elif align == "right":
            x = wmax - widths[i]
        draw_rich_line(d, x, asc + i * lhp, l, f, fh, color, hl)
    return im


# ---------------------------------------------------------------- iconos dibujados
def draw_check(d, x, y, s, fill, fg=(255, 255, 255)):
    d.ellipse((x, y, x + s, y + s), fill=fill)
    w = max(2, int(s * 0.12))
    d.line([(x + s * 0.28, y + s * 0.52), (x + s * 0.44, y + s * 0.68), (x + s * 0.73, y + s * 0.36)],
           fill=fg, width=w, joint="curve")


def draw_cross(d, x, y, s, fill, fg=(255, 255, 255)):
    d.ellipse((x, y, x + s, y + s), fill=fill)
    w = max(2, int(s * 0.12))
    a, b = s * 0.33, s * 0.67
    d.line([(x + a, y + a), (x + b, y + b)], fill=fg, width=w)
    d.line([(x + b, y + a), (x + a, y + b)], fill=fg, width=w)


def draw_items(im, items):
    """Dibuja una lista de items sobre una imagen RGBA (coordenadas locales)."""
    d = ImageDraw.Draw(im)
    for it in items:
        kind = it[0]
        if kind == "t":   # ("t", x, y, texto, tamaño, peso, color, {opciones})
            _, x, y, txt, size, wgt, color = it[:7]
            o = it[7] if len(it) > 7 else {}
            blk = text_block(txt, size, wgt, color, o.get("maxw"), o.get("lh", 1.3), o.get("hl"),
                             o.get("hlw"), o.get("align", "left"))
            im.alpha_composite(blk, (int(x), int(y)))
        elif kind == "tr":  # texto con tracking (mayúsculas)
            _, x, y, txt, size, wgt, color, track = it[:8]
            f = font(size, wgt)
            asc, _ = f.getmetrics()
            draw_tracked(d, x, y + asc, txt, f, color, track)
        elif kind == "e":
            _, x, y, ch, size = it
            e = emoji_img(ch, size)
            im.alpha_composite(e, (int(x), int(y)))
        elif kind == "badge":  # círculo con número
            _, x, y, label, s, fill, color = it
            d.ellipse((x, y, x + s, y + s), fill=fill)
            f = font(int(s * 0.46), 760)
            d.text((x + s / 2, y + s / 2 + 1), str(label), font=f, fill=color, anchor="mm")
        elif kind == "sq":  # cuadrado redondeado con número
            _, x, y, label, s, fill, color = it
            d.rounded_rectangle((x, y, x + s, y + s), int(s * 0.28), fill=fill)
            f = font(int(s * 0.46), 760)
            d.text((x + s / 2, y + s / 2 + 1), str(label), font=f, fill=color, anchor="mm")
        elif kind == "check":
            _, x, y, s, fill = it[:5]
            draw_check(d, x, y, s, fill)
        elif kind == "cross":
            _, x, y, s, fill = it[:5]
            draw_cross(d, x, y, s, fill)
        elif kind == "rect":
            _, x, y, w, h, fill, r = it
            d.rounded_rectangle((x, y, x + w, y + h), r, fill=fill)
        elif kind == "line":
            _, x1, y1, x2, y2, fill, wd = it
            d.line([(x1, y1), (x2, y2)], fill=fill, width=wd)
        elif kind == "img":  # ("img", x, y, ruta, w, h)
            _, x, y, path, w, h = it[:6]
            o = it[6] if len(it) > 6 else {}
            src = load(path)
            if o.get("cover"):
                pic = cover(src, w, h)
                if o.get("r"):
                    pic.putalpha(Image.composite(pic.getchannel("A"), Image.new("L", pic.size, 0),
                                                 rounded_mask(w, h, o["r"])))
                im.alpha_composite(pic, (int(x), int(y)))
            else:
                pic = contain(src, w, h)
                im.alpha_composite(pic, (int(x + (w - pic.width) / 2), int(y + (h - pic.height) / 2)))
        elif kind == "pill":  # ("pill", x, y, texto, relleno, color, tamaño)
            _, x, y, txt, fill, color, size = it
            f = font(size, 700)
            tl = tracked_len(txt, f, size * 0.12)
            ph, pw = int(size * 1.9), int(tl + size * 1.6)
            d.rounded_rectangle((x, y, x + pw, y + ph), ph // 2, fill=fill)
            asc, desc = f.getmetrics()
            draw_tracked(d, x + size * 0.8, y + ph / 2 + (asc - desc) / 2 - 1, txt, f, color, size * 0.12)
    return im


# ---------------------------------------------------------------- elementos
class El:
    dynamic = False

    def __init__(self, x=0, y=0, at=None, anim="up", dur=0.75, dist=46, delay=0.0, contact=False):
        self.contact = contact  # tarjeta de contacto personalizable (Laboratorio de Marketing)
        self.x, self.y = x, y
        self.at, self.anim, self.dur, self.dist, self.delay = at, anim, dur, dist, delay
        self.t0 = 0.0
        self.span = 10.0
        self._img = None
        self.ox = self.oy = 0  # desplazamiento por sombra

    def render(self):
        raise NotImplementedError

    def img(self):
        if self._img is None:
            self._img = self.render()
        return self._img

    def frame(self, t):
        return self.img()

    def draw(self, cv, t):
        if t < self.t0:
            return
        p = clamp((t - self.t0) / self.dur)
        e = eo3(p)
        im = self.frame(t)
        if im is None:
            return
        x, y, op = self.x + self.ox, self.y + self.oy, 1.0
        a = self.anim
        if a == "up":
            y += (1 - e) * self.dist
            op = e
        elif a == "down":
            y -= (1 - e) * self.dist
            op = e
        elif a == "left":
            x -= (1 - e) * self.dist
            op = e
        elif a == "right":
            x += (1 - e) * self.dist
            op = e
        elif a == "fade":
            op = e
        elif a == "scale":
            s = 0.55 + 0.45 * eback(p) if p < 1 else 1.0
            op = clamp(p * 2.5)
            if abs(s - 1) > 0.004:
                nw, nh = max(1, int(im.width * s)), max(1, int(im.height * s))
                x += (im.width - nw) / 2
                y += (im.height - nh) / 2
                im = im.resize((nw, nh), Image.BILINEAR)
        paste(cv, im, x, y, op)


class Group(El):
    """Items libres sin fondo."""

    def __init__(self, x, y, w, h, items, **kw):
        super().__init__(x, y, **kw)
        self.w, self.h, self.items = w, h, items

    def render(self):
        return draw_items(Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0)), self.items)


class Text(El):
    def __init__(self, text, x, y, size=30, weight=400, color=COL["white"], maxw=None, lh=1.4, hl=None,
                 hlw=None, align="left", **kw):
        super().__init__(x, y, **kw)
        self.args = (text, size, weight, color, maxw, lh, hl, hlw, align)

    def render(self):
        im = text_block(*self.args)
        if self.args[8] == "center" and self.args[4]:
            self.ox = 0
        return im


class Title(El):
    """Titular con revelado por líneas (texto que emerge desde una línea invisible)."""

    def __init__(self, text, x, y, size=74, color=COL["white"], hl=COL["orange"], maxw=1100, weight=760,
                 lh=1.08, stagger=0.1, align="left", **kw):
        kw.setdefault("dur", 0.85)
        super().__init__(x, y, **kw)
        self.text, self.size, self.color, self.hl = text, size, color, hl
        self.maxw, self.weight, self.lh, self.stagger, self.align = maxw, weight, lh, stagger, align
        self.lines = None

    def prep(self):
        f = font(self.size, self.weight)
        fh = font(self.size, self.weight)
        asc, desc = f.getmetrics()
        self.lines = []
        for i, l in enumerate(rich_lines(self.text, f, fh, self.maxw)):
            lw = int(line_len(l, f, fh)) + 8
            im = Image.new("RGBA", (lw, asc + desc + 6), (0, 0, 0, 0))
            draw_rich_line(ImageDraw.Draw(im), 0, asc + 2, l, f, fh, self.color, self.hl)
            x = 0
            if self.align == "center":
                x = -lw / 2
            elif self.align == "right":
                x = -lw
            self.lines.append((im, x, i * self.size * self.lh))

    @property
    def height(self):
        if self.lines is None:
            self.prep()
        return self.lines[-1][2] + self.size * 1.2

    def draw(self, cv, t):
        if self.lines is None:
            self.prep()
        for i, (im, lx, ly) in enumerate(self.lines):
            p = clamp((t - self.t0 - i * self.stagger) / self.dur)
            if p <= 0:
                continue
            e = eo3(p)
            hgt = im.height
            dy = int((1 - e) * hgt * 0.9)
            if dy >= hgt:
                continue
            part = im.crop((0, 0, im.width, hgt - dy)) if dy > 0 else im
            paste(cv, part, self.x + lx, self.y + ly + dy, clamp(e * 1.3))


class Kicker(El):
    """Rótulo de sección: línea de color + texto en mayúsculas espaciadas."""

    def __init__(self, text, x, y, color=COL["blue"], line=COL["blue"], size=21, **kw):
        kw.setdefault("anim", "left")
        super().__init__(x, y, **kw)
        self.text, self.color, self.line, self.size = text.upper(), color, line, size

    def render(self):
        f = font(self.size, 720)
        tr = self.size * 0.2
        tl = tracked_len(self.text, f, tr)
        im = Image.new("RGBA", (int(tl + 80), int(self.size * 1.6)), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        cy = im.height / 2
        d.rounded_rectangle((0, cy - 2, 46, cy + 2), 2, fill=self.line)
        asc, desc = f.getmetrics()
        draw_tracked(d, 62, cy + (asc - desc) / 2, self.text, f, self.color, tr)
        return im


class Pill(El):
    def __init__(self, text, x, y, fill=COL["blue_l"], color=COL["white"], size=21, align="left", **kw):
        kw.setdefault("anim", "down")
        kw.setdefault("dist", 24)
        super().__init__(x, y, **kw)
        self.text, self.fill, self.color, self.size, self.align = text.upper(), fill, color, size, align

    def render(self):
        f = font(self.size, 720)
        tr = self.size * 0.16
        tl = tracked_len(self.text, f, tr)
        ph, pw = int(self.size * 2.1), int(tl + self.size * 2.0)
        im = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((0, 0, pw - 1, ph - 1), ph // 2, fill=self.fill)
        asc, desc = f.getmetrics()
        draw_tracked(d, self.size, ph / 2 + (asc - desc) / 2, self.text, f, self.color, tr)
        if self.align == "right":
            self.ox = -pw
        elif self.align == "center":
            self.ox = -pw // 2
        return im


CARD_STYLES = {
    "light": dict(fill=rgba(COL["white"]), border=rgba(COL["line"]), shadow=46),
    "ice": dict(fill=rgba(COL["ice"]), border=rgba(COL["line"]), shadow=0),
    "glass": dict(fill=(14, 30, 52, 178), border=(255, 255, 255, 52), shadow=0),
    "glass2": dict(fill=(255, 255, 255, 30), border=(255, 255, 255, 70), shadow=0),
    "navy": dict(fill=rgba(COL["navy_d"]), border=None, shadow=60, grad=(COL["navy_d"], COL["deep"])),
    "blue": dict(fill=rgba(COL["blue"]), border=None, shadow=55, grad=(COL["blue"], COL["blue_l"])),
    "orange": dict(fill=rgba(COL["orange"]), border=None, shadow=55, grad=(COL["orange"], (255, 160, 90))),
    "white": dict(fill=rgba(COL["white"]), border=None, shadow=70),
    "none": dict(fill=(0, 0, 0, 0), border=None, shadow=0),
}


def grad_rect(w, h, c1, c2, horizontal=False):
    g = Image.linear_gradient("L").rotate(90 if horizontal else 0, expand=True).resize((w, h))
    if horizontal:
        g = g.transpose(Image.FLIP_LEFT_RIGHT)
    a = Image.new("RGBA", (w, h), rgba(c1))
    b = Image.new("RGBA", (w, h), rgba(c2))
    return Image.composite(b, a, g)


class Card(El):
    def __init__(self, x, y, w, h, items=(), style="light", r=26, accent=None, accent_side="left", **kw):
        super().__init__(x, y, **kw)
        self.w, self.h, self.items, self.style, self.r = w, h, list(items), style, r
        self.accent, self.accent_side = accent, accent_side

    def base(self):
        st = CARD_STYLES[self.style]
        pad = 46 if st["shadow"] else 0
        self.ox = self.oy = -pad
        im = Image.new("RGBA", (self.w + 2 * pad, self.h + 2 * pad), (0, 0, 0, 0))
        if st["shadow"]:
            sh = shadow_img(self.w, self.h, self.r, pad, alpha=st["shadow"], blur=20)
            im.alpha_composite(sh, (0, 12))
        body = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        mask = rounded_mask(self.w, self.h, self.r)
        if st.get("grad"):
            fill = grad_rect(self.w, self.h, *st["grad"], horizontal=True)
        else:
            fill = Image.new("RGBA", (self.w, self.h), st["fill"])
        body.paste(fill, (0, 0), mask)
        if fill.mode == "RGBA" and st["fill"][3] < 255 and not st.get("grad"):
            body = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
            body.paste(fill, (0, 0), Image.composite(Image.new("L", mask.size, st["fill"][3]),
                                                     Image.new("L", mask.size, 0), mask))
        d = ImageDraw.Draw(body)
        if self.accent:
            if self.accent_side == "left":
                d.rounded_rectangle((0, 0, 7, self.h), 3, fill=self.accent)
                body.putalpha(Image.composite(body.getchannel("A"), Image.new("L", mask.size, 0), mask))
            else:
                d.rectangle((0, 0, self.w, 6), fill=self.accent)
                body.putalpha(Image.composite(body.getchannel("A"), Image.new("L", mask.size, 0), mask))
        if st["border"]:
            d.rounded_rectangle((0, 0, self.w - 1, self.h - 1), self.r, outline=st["border"], width=2)
        draw_items(body, self.items)
        im.alpha_composite(body, (pad, pad))
        return im

    def render(self):
        return self.base()


NUM_LOCALE = "es"   # "es" -> 1.234,5   ·   "en" -> 1,234.5


def fmt_num(v, dec=0):
    s = f"{v:,.{dec}f}" if dec else f"{int(round(v)):,}"
    if NUM_LOCALE == "en":
        return s
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


class Stat(Card):
    """Tarjeta con cifra animada (contador)."""

    def __init__(self, x, y, w, h, tmpl, vals, label, style="glass", num_color=COL["orange"], num_size=58,
                 label_color=(255, 255, 255, 225), label_size=22, icon=None, count=1.4, nx=30, ny=24,
                 decimals=0, align="left", **kw):
        super().__init__(x, y, w, h, style=style, **kw)
        self.tmpl, self.vals, self.count, self.decimals = tmpl, vals, count, decimals
        self.num_color, self.num_size, self.nx, self.ny, self.align_n = num_color, num_size, nx, ny, align
        ly = ny + num_size * 1.18
        lx = nx
        if icon:
            self.items.append(("e", w - 30 - 54, 26, icon, 54))
        if align == "center":
            self.items.append(("t", 20, ly, label, label_size, 500, label_color,
                               {"maxw": w - 40, "align": "center", "lh": 1.3}))
        else:
            self.items.append(("t", lx, ly, label, label_size, 500, label_color,
                               {"maxw": w - lx - 24, "lh": 1.3}))
        self.dynamic = True
        self._final = None

    def text_at(self, p):
        e = eo3(p)
        vs = [fmt_num(v * e if isinstance(v, (int, float)) else v, self.decimals) if isinstance(v, (int, float))
              else v for v in self.vals]
        return self.tmpl.format(*vs)

    def compose(self, txt):
        im = self.img().copy()
        d = ImageDraw.Draw(im)
        f = font(self.num_size, 780)
        asc, _ = f.getmetrics()
        x = -self.ox + self.nx
        if self.align_n == "center":
            x = -self.ox + self.w / 2 - f.getlength(txt) / 2
        d.text((x, -self.oy + self.ny + asc), txt, font=f, fill=self.num_color, anchor="ls")
        return im

    def frame(self, t):
        p = clamp((t - self.t0 - 0.1) / self.count)
        if p >= 1:
            if self._final is None:
                self._final = self.compose(self.text_at(1))
            return self._final
        return self.compose(self.text_at(p))


class Photo(El):
    """Fotografía con esquinas redondeadas y movimiento Ken Burns continuo."""
    dynamic = True

    def __init__(self, x, y, w, h, path, r=28, kb=(1.0, 1.14), pan=((0.5, 0.5), (0.5, 0.5)), shadow=True,
                 tag=None, focus=(0.5, 0.5), **kw):
        kw.setdefault("anim", "fade")
        super().__init__(x, y, **kw)
        self.w, self.h, self.path, self.r, self.kb, self.pan = w, h, path, r, kb, pan
        self.shadow, self.tag, self.focus = shadow, tag, focus
        self.ready = False

    def prep(self):
        S = 1.25
        self.src = cover(load(self.path), int(self.w * S), int(self.h * S), *self.focus).convert("RGB")
        self.mask = rounded_mask(self.w, self.h, self.r)
        self.pad = 46 if self.shadow else 0
        self.ox = self.oy = -self.pad
        self.shd = shadow_img(self.w, self.h, self.r, self.pad, alpha=70, blur=22) if self.shadow else None
        self.tag_img = None
        if self.tag:
            blk = text_block(self.tag, 20, 600, COL["white"])
            tw, th = blk.width + 40, 44
            t = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
            ImageDraw.Draw(t).rounded_rectangle((0, 0, tw - 1, th - 1), 22, fill=(12, 28, 48, 190))
            t.alpha_composite(blk, (20, (th - blk.height) // 2 + 1))
            self.tag_img = t
        self.ready = True

    def kb_frame(self, p):
        S = 1.25
        z = lerp(self.kb[0], self.kb[1], p)
        z = clamp(z, 1.0, S)
        ww, hh = self.src.width / z, self.src.height / z
        fx = lerp(self.pan[0][0], self.pan[1][0], p)
        fy = lerp(self.pan[0][1], self.pan[1][1], p)
        x0 = (self.src.width - ww) * fx
        y0 = (self.src.height - hh) * fy
        return self.src.resize((self.w, self.h), Image.BILINEAR, box=(x0, y0, x0 + ww, y0 + hh))

    def frame(self, t):
        if not self.ready:
            self.prep()
        p = clamp((t - self.t0) / max(0.1, self.span))
        fr = self.kb_frame(p)
        out = Image.new("RGBA", (self.w + 2 * self.pad, self.h + 2 * self.pad), (0, 0, 0, 0))
        if self.shd:
            out.alpha_composite(self.shd, (0, 14))
        out.paste(fr, (self.pad, self.pad), self.mask)
        if self.tag_img:
            out.alpha_composite(self.tag_img, (self.pad + 22, self.pad + self.h - 66))
        return out


class Slideshow(Photo):
    """Varias fotos que se suceden con fundido, cada una sincronizada con la voz."""

    def __init__(self, x, y, w, h, slides, **kw):
        # slides: [(ruta, at, tag)]
        super().__init__(x, y, w, h, slides[0][0], **kw)
        self.slides = slides
        self.times = None

    def prep(self):
        self.subs = []
        for path, _, tag in self.slides:
            ph = Photo(0, 0, self.w, self.h, path, r=self.r, kb=self.kb, pan=self.pan, shadow=False)
            ph.prep()
            self.subs.append(ph)
            ph.tag_img = None
            if tag:
                blk = text_block(tag, 20, 600, COL["white"])
                tw, th = blk.width + 40, 44
                ti = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
                ImageDraw.Draw(ti).rounded_rectangle((0, 0, tw - 1, th - 1), 22, fill=(12, 28, 48, 190))
                ti.alpha_composite(blk, (20, (th - blk.height) // 2 + 1))
                ph.tag_img = ti
        self.mask = rounded_mask(self.w, self.h, self.r)
        self.pad = 46 if self.shadow else 0
        self.ox = self.oy = -self.pad
        self.shd = shadow_img(self.w, self.h, self.r, self.pad, alpha=70, blur=22) if self.shadow else None
        self.ready = True

    def frame(self, t):
        if not self.ready:
            self.prep()
        times = self.times or [self.t0] * len(self.slides)
        idx = 0
        for i, ts in enumerate(times):
            if t >= ts:
                idx = i
        FD = 0.6

        def sub_frame(i):
            ph = self.subs[i]
            start = times[i]
            end = times[i + 1] + FD if i + 1 < len(times) else self.t0 + self.span
            p = clamp((t - start) / max(0.5, end - start))
            return ph.kb_frame(p), ph.tag_img

        fr, tag = sub_frame(idx)
        if idx > 0 and t - times[idx] < FD:
            prev, _ = sub_frame(idx - 1)
            fr = Image.blend(prev, fr, eio((t - times[idx]) / FD))
        out = Image.new("RGBA", (self.w + 2 * self.pad, self.h + 2 * self.pad), (0, 0, 0, 0))
        if self.shd:
            out.alpha_composite(self.shd, (0, 14))
        out.paste(fr, (self.pad, self.pad), self.mask)
        if tag:
            out.alpha_composite(tag, (self.pad + 22, self.pad + self.h - 66))
        return out


class Logo(El):
    def __init__(self, path, x, y, w=None, h=None, chip=None, chip_pad=(26, 16), r=18, align="left", **kw):
        kw.setdefault("anim", "fade")
        super().__init__(x, y, **kw)
        self.path, self.w, self.h, self.chip, self.chip_pad, self.r, self.align = path, w, h, chip, chip_pad, r, align

    def render(self):
        src = load(self.path)
        bb = src.getchannel("A").getbbox()
        if bb:
            src = src.crop(bb)
        if self.w and self.h:
            im = contain(src, self.w, self.h)
        elif self.w:
            im = src.resize((self.w, max(1, round(src.height * self.w / src.width))), Image.LANCZOS)
        else:
            im = src.resize((max(1, round(src.width * self.h / src.height)), self.h), Image.LANCZOS)
        if self.chip:
            px, py = self.chip_pad
            c = Image.new("RGBA", (im.width + 2 * px, im.height + 2 * py), (0, 0, 0, 0))
            ImageDraw.Draw(c).rounded_rectangle((0, 0, c.width - 1, c.height - 1), self.r, fill=self.chip)
            c.alpha_composite(im, (px, py))
            im = c
        if self.align == "center":
            self.ox = -im.width // 2
        elif self.align == "right":
            self.ox = -im.width
        return im


class Line(El):
    """Línea que se dibuja progresivamente (conectores, líneas de tiempo)."""
    dynamic = True

    def __init__(self, x1, y1, x2, y2, color=COL["blue"], width=4, dashed=False, **kw):
        kw.setdefault("anim", "none")
        kw.setdefault("dur", 0.6)
        super().__init__(0, 0, **kw)
        self.p1, self.p2, self.color, self.width, self.dashed = (x1, y1), (x2, y2), color, width, dashed

    def draw(self, cv, t):
        if t < self.t0:
            return
        p = eio(clamp((t - self.t0) / self.dur))
        x1, y1 = self.p1
        x2 = lerp(x1, self.p2[0], p)
        y2 = lerp(y1, self.p2[1], p)
        d = ImageDraw.Draw(cv)
        if self.dashed:
            L = math.hypot(x2 - x1, y2 - y1)
            n = int(L // 18)
            for i in range(n):
                a, b = i * 18 / max(L, 1), (i * 18 + 10) / max(L, 1)
                d.line([(lerp(x1, x2, a), lerp(y1, y2, a)), (lerp(x1, x2, b), lerp(y1, y2, b))],
                       fill=self.color, width=self.width)
        else:
            d.line([(x1, y1), (x2, y2)], fill=self.color, width=self.width)


class SplitBar(El):
    """Barra dividida (p. ej. reparto agencia / agente) que crece animada."""
    dynamic = True

    def __init__(self, x, y, w, h, frac, left_label, right_label, c1=COL["orange"], c2=COL["blue_l"],
                 bg=(255, 255, 255, 40), **kw):
        kw.setdefault("anim", "fade")
        kw.setdefault("dur", 0.4)
        super().__init__(x, y, **kw)
        self.w, self.h, self.frac, self.ll, self.rl, self.c1, self.c2, self.bg = w, h, frac, left_label, right_label, c1, c2, bg

    def frame(self, t):
        p = eio(clamp((t - self.t0 - 0.1) / 1.1))
        im = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        r = self.h // 2
        d.rounded_rectangle((0, 0, self.w - 1, self.h - 1), r, fill=self.bg)
        lw = self.w * self.frac * p
        rw = self.w * (1 - self.frac) * p
        mask = rounded_mask(self.w, self.h, r)
        bar = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bar)
        if lw > 1:
            bd.rectangle((0, 0, lw, self.h), fill=self.c1)
        if rw > 1:
            bd.rectangle((self.w - rw, 0, self.w, self.h), fill=self.c2)
        im.paste(bar, (0, 0), Image.composite(bar.getchannel("A"), Image.new("L", mask.size, 0), mask))
        f = font(int(self.h * 0.42), 720)
        if p > 0.6:
            a = int(255 * clamp((p - 0.6) / 0.4))
            if self.frac > 0.12:
                d.text((22, self.h / 2), self.ll, font=f, fill=(255, 255, 255, a), anchor="lm")
            if self.frac < 0.88:
                d.text((self.w - 22, self.h / 2), self.rl, font=f, fill=(255, 255, 255, a), anchor="rm")
        return im


# ---------------------------------------------------------------- fondos
class Background:
    def __init__(self, theme="dark", photo=None, kb=(1.02, 1.16), pan=((0.5, 0.5), (0.5, 0.5)),
                 veil="left", focus=(0.5, 0.5), bignum=None, strength=1.0):
        self.theme, self.photo, self.kb, self.pan, self.veil = theme, photo, kb, pan, veil
        self.focus, self.bignum, self.strength = focus, bignum, strength
        self.ready = False
        self.dur = 10

    def prep(self):
        if self.theme == "dark" and self.photo:
            self.ph = Photo(0, 0, W, H, self.photo, r=0, kb=self.kb, pan=self.pan, shadow=False, focus=self.focus)
            self.ph.prep()
            self.veil_mask = self.make_veil()
            self.veil_col = Image.new("RGB", (W, H), COL["ink"])
        elif self.theme == "navy":
            g = grad_rect(W, H, (10, 26, 46), (8, 62, 112), horizontal=True).convert("RGB")
            d = ImageDraw.Draw(g, "RGBA")
            # olas sutiles inspiradas en el logotipo
            for k, (amp, yb, col) in enumerate([(38, 820, (10, 137, 246, 34)), (30, 880, (6, 114, 197, 40)),
                                                 (24, 940, (254, 137, 51, 22))]):
                pts = [(x, yb + amp * math.sin(x / 260 + k)) for x in range(0, W + 20, 20)]
                d.polygon(pts + [(W, H), (0, H)], fill=col)
            sun = Image.new("L", (W, H), 0)
            ImageDraw.Draw(sun).ellipse((W - 520, -260, W + 180, 440), fill=60)
            sun = sun.filter(ImageFilter.GaussianBlur(80))
            g.paste(Image.new("RGB", (W, H), COL["orange"]), (0, 0), sun)
            self.static = g
        else:  # light
            g = Image.new("RGB", (W, H), COL["cream"])
            glow = Image.new("L", (W, H), 0)
            ImageDraw.Draw(glow).ellipse((W - 900, -500, W + 300, 500), fill=110)
            glow = glow.filter(ImageFilter.GaussianBlur(140))
            g.paste(Image.new("RGB", (W, H), COL["ice"]), (0, 0), glow)
            glow2 = Image.new("L", (W, H), 0)
            ImageDraw.Draw(glow2).ellipse((-400, H - 300, 500, H + 400), fill=60)
            glow2 = glow2.filter(ImageFilter.GaussianBlur(140))
            g.paste(Image.new("RGB", (W, H), (255, 236, 219)), (0, 0), glow2)
            if self.bignum:
                f = font(240, 800)
                d = ImageDraw.Draw(g)
                d.text((W - 90, 108), self.bignum, font=f, fill=(232, 240, 250), anchor="ra")
            self.static = g
        self.ready = True

    def make_veil(self):
        s = self.strength
        if self.veil == "left":
            gx = Image.linear_gradient("L").rotate(90, expand=True).resize((W, H))  # 255 izq -> 0 der
            gx = gx.point(lambda v: int((95 + v * 0.62) * s))
        elif self.veil == "right":
            gx = Image.linear_gradient("L").rotate(-90, expand=True).resize((W, H))
            gx = gx.point(lambda v: int((95 + v * 0.62) * s))
        elif self.veil == "center":
            gx = Image.new("L", (W, H), int(175 * s))
        else:  # full
            gx = Image.new("L", (W, H), int(200 * s))
        gy = Image.linear_gradient("L").resize((W, H))  # 0 arriba -> 255 abajo
        gy = gy.point(lambda v: int(max(0, v - 120) * 1.3))
        top = Image.linear_gradient("L").rotate(180).resize((W, H)).point(lambda v: int(max(0, v - 170) * 1.4))
        from PIL import ImageChops
        m = ImageChops.lighter(ImageChops.lighter(gx, gy), top)
        return m

    def frame(self, t):
        if not self.ready:
            self.prep()
        if self.theme == "dark" and self.photo:
            fr = self.ph.kb_frame(clamp(t / max(1, self.dur + TRANS)))
            fr.paste(self.veil_col, (0, 0), self.veil_mask)
            return fr
        return self.static.copy()


# ---------------------------------------------------------------- escenas
def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def find_word(words, key):
    occ = 1
    if "#" in key:
        key, n = key.split("#")
        occ = int(n)
    k = norm(key)
    c = 0
    for st, _, w in words:
        if any(norm(p).startswith(k) for p in w.split() or [w]):
            c += 1
            if c == occ:
                return st
    print(f"   ⚠️  palabra clave no encontrada en la voz: '{key}'")
    return None


class Scene:
    def __init__(self, sid, text, bg, els, header=None, page=None, hold=3.0, chrome=True):
        self.sid, self.text, self.bg, self.els, self.header, self.page = sid, text, bg, els, header, page
        self.hold, self.show_chrome = hold, chrome
        self.dur = 6.0
        self.chrome = None

    def resolve(self, at, words, voice_dur, fallback):
        if at is None:
            return fallback
        if isinstance(at, (int, float)):
            return LEAD + at
        off = 0.0
        if isinstance(at, tuple):
            at, off = at
        st = find_word(words, at)
        if st is None:
            return fallback
        return LEAD + st - 0.12 + off

    def setup(self, words, voice_dur, total_pages):
        self.dur = LEAD + voice_dur + TAIL
        self.bg.dur = self.dur
        self.total_pages = total_pages
        auto = 0
        for el in self.els:
            fb = 0.5 + 0.11 * auto
            if el.at is None:
                auto += 1
            el.t0 = max(0.45, self.resolve(el.at, words, voice_dur, fb) + el.delay)
            el.span = self.dur + TRANS - el.t0
            if isinstance(el, Slideshow):
                el.times = [max(el.t0, self.resolve(a, words, voice_dur, el.t0)) for _, a, _ in el.slides]

    def make_chrome(self):
        dark = self.bg.theme in ("dark", "navy")
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        logo = load("Presentación Spain Connection/_recursos/img/" + ("sc-logo-blanco.png" if dark else "sc-logo.png"))
        bb = logo.getchannel("A").getbbox()
        logo = logo.crop(bb)
        lh = 70
        logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
        im.alpha_composite(logo, (96, 44))
        d = ImageDraw.Draw(im)
        if self.header:
            f = font(19, 700)
            txt = self.header.upper()
            tl = tracked_len(txt, f, 3.6)
            col = (255, 255, 255, 215) if dark else rgba(COL["slate"])
            x = W - 96 - tl
            asc, desc = f.getmetrics()
            d.ellipse((x - 26, 79 - 5, x - 16, 79 + 5), fill=COL["orange"])
            draw_tracked(d, x, 79 + (asc - desc) / 2, txt, f, col, 3.6)
        f2 = font(17, 500)
        fc = (255, 255, 255, 150) if dark else rgba(COL["gray"])
        d.text((96, H - 42), "2026 © The Spain Connection · by RE/MAX Inmomás", font=f2, fill=fc, anchor="ls")
        if self.page:
            f3 = font(17, 700)
            d.text((W - 96, H - 42), f"{self.page:02d} / {self.total_pages:02d}", font=f3, fill=fc, anchor="rs")
        return im

    def frame(self, t):
        cv = self.bg.frame(t)
        if self.chrome is None:
            self.chrome = self.make_chrome()
        if self.show_chrome:
            cv.paste(self.chrome, (0, 0), self.chrome)
        for el in self.els:
            if LAB_MODE and el.contact:
                continue
            el.draw(cv, t)
        return cv


# ---------------------------------------------------------------- transición y montaje
_logo_w = None


def wipe(cv, phase, c, p):
    global _logo_w
    d = ImageDraw.Draw(cv)
    S = 300
    ext = 160 + S
    pos = -ext + c * (W + 2 * ext)
    layers = [(COL["orange"], 0), (COL["blue_l"], 56), (COL["deep"], 160)]
    if phase == "cover":
        for col, off in layers:
            e = pos - off
            d.polygon([(-10, -10), (e + S, -10), (e, H + 10), (-10, H + 10)], fill=col)
    else:
        for col, off in layers:
            e = pos + off
            d.polygon([(e + S, -10), (W + 10, -10), (W + 10, H + 10), (e, H + 10)], fill=col)
    op = clamp(1 - abs(p - 0.5) / 0.2)
    if op > 0:
        if _logo_w is None:
            lg = load("Presentación Spain Connection/_recursos/img/sc-logo-blanco.png")
            lg = lg.crop(lg.getchannel("A").getbbox())
            _logo_w = lg.resize((420, round(lg.height * 420 / lg.width)), Image.LANCZOS)
        s = 0.92 + 0.08 * op
        lg = _logo_w.resize((int(_logo_w.width * s), int(_logo_w.height * s)), Image.BILINEAR)
        paste(cv, lg, (W - lg.width) / 2, (H - lg.height) / 2, op)


class Timeline:
    def __init__(self, scenes):
        self.scenes = scenes
        self.starts = []
        t = 0
        for s in scenes:
            self.starts.append(t)
            t += s.dur
        self.total = t
        self._end_cache = {}

    def frame(self, t):
        i = 0
        for k, st in enumerate(self.starts):
            if t >= st:
                i = k
        sc = self.scenes[i]
        local = t - self.starts[i]
        if i > 0 and local < TRANS:
            p = local / TRANS
            if p < 0.5:
                if i - 1 not in self._end_cache:
                    prev = self.scenes[i - 1]
                    self._end_cache[i - 1] = prev.frame(prev.dur)
                cv = self._end_cache[i - 1].copy()
                wipe(cv, "cover", eio(p / 0.5), p)
            else:
                cv = sc.frame(local)
                wipe(cv, "reveal", eio((p - 0.5) / 0.5), p)
        else:
            cv = sc.frame(local)
        # barra de progreso de marca
        d = ImageDraw.Draw(cv)
        d.rectangle((0, H - 6, W, H), fill=(255, 255, 255) if sc.bg.theme == "light" else (20, 36, 58))
        d.rectangle((0, H - 6, int(W * t / self.total), H), fill=COL["orange"])
        # fundidos de entrada / salida
        k = min(clamp(t / 0.6), clamp((self.total - t) / 1.0))
        if k < 1:
            cv = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), cv, eio(k))
        return cv


# ---------------------------------------------------------------- atajos de composición
def is_dark(style):
    return style in ("glass", "glass2", "navy", "blue", "orange")


def text_h(text, size, weight, maxw, lh):
    f = font(size, weight)
    fh = font(size, max(weight, 700))
    return len(rich_lines(text, f, fh, maxw)) * size * lh


def feature(x, y, w, h, emoji, title, body, style="light", at=None, icon=54, tsize=26, bsize=21,
            layout="side", hl=None, **kw):
    dark = is_dark(style)
    tc = COL["white"] if dark else COL["navy"]
    bc = (255, 255, 255, 215) if dark else COL["slate"]
    hlc = hl or (COL["orange_l"] if dark else COL["blue"])
    items = []
    if layout == "side":
        items.append(("e", 30, 30, emoji, icon))
        tx, ty = 30 + icon + 24, 28
    else:
        items.append(("e", 30, 28, emoji, icon))
        tx, ty = 30, 28 + icon + 20
    tw = w - tx - 26
    items.append(("t", tx, ty, title, tsize, 720, tc, {"maxw": tw, "lh": 1.2}))
    by = ty + text_h(title, tsize, 720, tw, 1.2) + 8
    if body:
        items.append(("t", tx, by, body, bsize, 450, bc, {"maxw": tw, "lh": 1.4, "hl": hlc}))
    return Card(x, y, w, h, items, style=style, at=at, **kw)


def step(x, y, w, h, num, title, body, style="light", fill=COL["blue"], tag=None, at=None, tsize=27,
         bsize=21, **kw):
    dark = is_dark(style)
    tc = COL["white"] if dark else COL["navy"]
    bc = (255, 255, 255, 215) if dark else COL["slate"]
    items = [("sq", 28, 28, num, 58, fill, COL["white"])]
    if tag:
        items.append(("tr", 104, 44, tag.upper(), 16, 720, COL["orange_l"] if dark else COL["blue"], 2.6))
    ty = 112
    tw = w - 56
    items.append(("t", 28, ty, title, tsize, 720, tc, {"maxw": tw, "lh": 1.18}))
    by = ty + text_h(title, tsize, 720, tw, 1.18) + 8
    items.append(("t", 28, by, body, bsize, 450, bc, {"maxw": tw, "lh": 1.4,
                                                      "hl": COL["orange_l"] if dark else COL["blue"]}))
    return Card(x, y, w, h, items, style=style, at=at, **kw)


def chip(x, y, w, h, icon, text, style="ice", at=None, size=24, weight=650, sub=None, **kw):
    """Tarjeta horizontal: icono (emoji, 'check' o 'cross') + texto centrado verticalmente."""
    dark = is_dark(style)
    tc = COL["white"] if dark else COL["navy"]
    s = int(min(h - 30, 46))
    items = []
    iy = (h - s) / 2
    if icon == "check":
        items.append(("check", 24, iy, s, COL["green"] if not dark else COL["orange"]))
    elif icon == "cross":
        items.append(("cross", 24, iy, s, COL["red"]))
    elif icon:
        items.append(("e", 24, iy, icon, s))
    tx = 24 + s + 18 if icon else 28
    tw = w - tx - 20
    th = text_h(text, size, weight, tw, 1.25)
    if sub:
        sh = text_h(sub, int(size * 0.8), 450, tw, 1.3)
        ty = (h - th - sh - 4) / 2
        items.append(("t", tx, ty, text, size, weight, tc, {"maxw": tw, "lh": 1.25,
                                                            "hl": COL["orange_l"] if dark else COL["blue"]}))
        items.append(("t", tx, ty + th + 4, sub, int(size * 0.8), 450,
                      (255, 255, 255, 200) if dark else COL["slate"], {"maxw": tw, "lh": 1.3}))
    else:
        ty = (h - th) / 2 + 1
        items.append(("t", tx, ty, text, size, weight, tc, {"maxw": tw, "lh": 1.25,
                                                            "hl": COL["orange_l"] if dark else COL["blue"]}))
    return Card(x, y, w, h, items, style=style, at=at, r=min(26, h // 2), **kw)


def header(kicker, title, dark, y=168, size=74, maxw=1100, at_title=0.0, x=120, **kw):
    kc = COL["orange_l"] if dark else COL["blue"]
    els = [Kicker(kicker, x, y, color=(255, 255, 255) if dark else COL["blue"], line=COL["orange"] if dark else COL["blue"], at=-0.4),
           Title(title, x, y + 52, size=size, maxw=maxw, color=COL["white"] if dark else COL["navy"],
                 hl=COL["orange"] if dark else COL["blue"], at=at_title, **kw)]
    return els
