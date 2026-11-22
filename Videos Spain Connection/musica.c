// Música de fondo "Mediterranean Lounge" sintetizada — The Spain Connection
// Uso: ./musica <duracion_seg> <salida.wav> <estilo: guia|brokers>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define SR 48000
#define PI 3.14159265358979

static uint32_t rng = 22222;
static float noise(void) {
    rng = rng * 1664525u + 1013904223u;
    return ((rng >> 8) / 8388608.0f) - 1.0f;
}
static double mtof(double m) { return 440.0 * pow(2.0, (m - 69.0) / 12.0); }

static void wr32(FILE *f, uint32_t v) { fwrite(&v, 4, 1, f); }
static void wr16(FILE *f, uint16_t v) { fwrite(&v, 2, 1, f); }

int main(int argc, char **argv) {
    if (argc < 4) {
        fprintf(stderr, "uso: musica dur out.wav estilo\n");
        return 1;
    }
    double dur = atof(argv[1]);
    const char *out = argv[2];
    int brokers = strcmp(argv[3], "brokers") == 0;
    long n = (long)(dur * SR);
    float *L = calloc(n, sizeof(float)), *R = calloc(n, sizeof(float));
    float *pl = calloc(n, sizeof(float));  // pluck (antes del delay)
    if (!L || !R || !pl) return 1;

    double bpm = brokers ? 104.0 : 92.0;
    double beat = 60.0 / bpm, bar = beat * 4;
    // acordes (MIDI) — 4 compases que se repiten
    int guia[4][4] = {{53, 57, 60, 64}, {57, 60, 64, 67}, {50, 53, 57, 60}, {46, 50, 53, 57}};   // Fmaj7 Am7 Dm7 Bbmaj7
    int brk[4][4] = {{57, 60, 64, 67}, {53, 57, 60, 64}, {48, 52, 55, 59}, {55, 59, 62, 65}};    // Am7 Fmaj7 Cmaj7 G7
    int (*ch)[4] = brokers ? brk : guia;

    for (long i = 0; i < n; i++) {
        double t = (double)i / SR;
        int b = (int)(t / bar);
        int ci = b % 4, cp = (b + 3) % 4;
        double bt = fmod(t, bar);
        double xf = bt < 0.8 ? bt / 0.8 : 1.0;   // fundido entre acordes
        double pad = 0;
        for (int k = 0; k < 4; k++) {
            for (int d = -1; d <= 1; d++) {
                double fc = mtof(ch[ci][k]) * (1 + d * 0.0021);
                double fp = mtof(ch[cp][k]) * (1 + d * 0.0021);
                pad += xf * (sin(2 * PI * fc * t) + 0.18 * sin(4 * PI * fc * t));
                pad += (1 - xf) * (sin(2 * PI * fp * t) + 0.18 * sin(4 * PI * fp * t));
            }
        }
        double swell = 0.75 + 0.25 * sin(2 * PI * t / (bar * 2));
        pad *= 0.016 * swell;

        // bajo
        double bb = fmod(t, beat * 2);
        double fb = mtof(ch[ci][0] - 12);
        double bass = (sin(2 * PI * fb * t) + 0.25 * sin(4 * PI * fb * t)) * exp(-bb * 2.2) * 0.16;

        // bombo
        double kick = 0;
        double kb = fmod(t, brokers ? beat : beat * 2);
        if (kb < 0.35) {
            double f = 45 + 85 * exp(-kb * 28);
            kick = sin(2 * PI * f * kb) * exp(-kb * 9) * (brokers ? 0.30 : 0.24);
        }
        // hi-hat en contratiempo
        double hat = 0;
        double hb = fmod(t + beat / 2, beat);
        static float prevn = 0;
        float nz = noise();
        float hp = nz - prevn;
        prevn = nz;
        if (hb < 0.06) hat = hp * exp(-hb * 70) * (brokers ? 0.05 : 0.035);
        // palmada suave en 2 y 4 (brokers)
        double clap = 0;
        if (brokers) {
            double cb = fmod(t + beat, beat * 2);
            if (cb < 0.2) clap = nz * exp(-cb * 22) * 0.05;
        }
        // arpegio pluck en corcheas
        double eb = fmod(t, beat / 2);
        int step = (int)(t / (beat / 2));
        int pat[8] = {0, 2, 1, 3, 2, 1, 3, 2};
        double fpk = mtof(ch[ci][pat[step % 8]] + 12);
        double pluck = (sin(2 * PI * fpk * eb) + 0.35 * sin(4 * PI * fpk * eb) + 0.1 * sin(6 * PI * fpk * eb)) *
                       exp(-eb * 7.5) * 0.06;
        pl[i] = (float)pluck;

        double mono = pad + bass + kick + clap;
        L[i] = (float)(mono + hat * 0.8);
        R[i] = (float)(mono + hat * 1.2);
    }
    // delay ping-pong del arpegio
    long dl = (long)(beat * 0.75 * SR);
    float *dlL = calloc(n, sizeof(float)), *dlR = calloc(n, sizeof(float));
    for (long i = 0; i < n; i++) {
        float inL = pl[i] * 0.9f, inR = pl[i] * 0.7f;
        float fbL = i >= dl ? dlR[i - dl] * 0.38f : 0;
        float fbR = i >= dl ? dlL[i - dl] * 0.38f : 0;
        dlL[i] = (i >= dl ? pl[i - dl] * 0.5f : 0) + fbL;
        dlR[i] = fbR;
        L[i] += inL + dlL[i] * 0.55f;
        R[i] += inR + dlR[i] * 0.55f + (i >= dl / 2 ? pl[i - dl / 2] * 0.15f : 0);
    }
    // master: saturación suave, fundidos, normalización
    float peak = 0;
    for (long i = 0; i < n; i++) {
        double t = (double)i / SR;
        double g = fmin(1.0, t / 2.5) * fmin(1.0, (dur - t) / 3.5);
        if (g < 0) g = 0;
        L[i] = (float)(tanh(L[i] * 1.4) * g);
        R[i] = (float)(tanh(R[i] * 1.4) * g);
        if (fabsf(L[i]) > peak) peak = fabsf(L[i]);
        if (fabsf(R[i]) > peak) peak = fabsf(R[i]);
    }
    float norm = peak > 0 ? 0.85f / peak : 1;
    FILE *f = fopen(out, "wb");
    if (!f) return 1;
    uint32_t data = (uint32_t)(n * 4);
    fwrite("RIFF", 1, 4, f); wr32(f, 36 + data); fwrite("WAVEfmt ", 1, 8, f);
    wr32(f, 16); wr16(f, 1); wr16(f, 2); wr32(f, SR); wr32(f, SR * 4); wr16(f, 4); wr16(f, 16);
    fwrite("data", 1, 4, f); wr32(f, data);
    for (long i = 0; i < n; i++) {
        int16_t a = (int16_t)(L[i] * norm * 32767), c = (int16_t)(R[i] * norm * 32767);
        fwrite(&a, 2, 1, f); fwrite(&c, 2, 1, f);
    }
    fclose(f);
    return 0;
}
