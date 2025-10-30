# --------------------------------------------------------------
#  ČISTÝ SLOUPCOVÝ VISUALIZÉR – 128 SLOUPCŮ, BEZ CHYB, INT VŠUDE
# --------------------------------------------------------------
import pygame
import numpy as np
from pydub import AudioSegment
import threading
import os

# ==================== NASTAVENÍ ====================
SONG_PATH = "../song2.mp3"       # ← TVŮJ SOUBOR
WIDTH, HEIGHT = 1000, 600
FPS = 60
NUM_BARS = 128                  # ← MŮŽEŠ ZMĚNIT
SMOOTHING = 0.8                 # Plynulost
BAR_SCALE = 0.6                # Výška sloupců
# ===================================================

# --- Kontrola souboru ---
if not os.path.exists(SONG_PATH):
    print(f"CHYBA: Soubor nenalezen: {SONG_PATH}")
    exit()

# --- Načtení MP3 ---
try:
    audio = AudioSegment.from_file(SONG_PATH).set_channels(1).set_frame_rate(44100)
except Exception as e:
    print(f"CHYBA při načítání: {e}")
    exit()

samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
if np.max(np.abs(samples)) > 0:
    samples = samples / np.max(np.abs(samples))
else:
    samples = np.zeros_like(samples)

# --- Pygame ---
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption(f"Přehrávám: {os.path.basename(SONG_PATH)}")
clock = pygame.time.Clock()
font = pygame.font.SysFont("Arial", 20, bold=True)

pygame.mixer.init(frequency=44100)
pygame.mixer.music.load(SONG_PATH)

def play_music():
    pygame.mixer.music.play()
threading.Thread(target=play_music, daemon=True).start()

# --- Stav ---
running = True
bar_heights = [0.0] * NUM_BARS
bar_width = WIDTH / NUM_BARS  # float

# --- Hlavní smyčka ---
while running:
    # --- Pozice ---
    pos_ms = pygame.mixer.music.get_pos()
    pos_sec = pos_ms / 1000 if pos_ms > 0 else 0
    idx = int(pos_sec * 44100)
    duration = len(audio) / 1000
    progress = min(pos_sec / duration, 1.0) if duration > 0 else 0

    # --- Chunk ---
    chunk_size = 1024
    end = idx + chunk_size
    if end < len(samples):
        chunk = samples[idx:end]
    else:
        chunk = np.zeros(chunk_size)

    # --- Rozdělení na pásma ---
    segment_size = len(chunk) // NUM_BARS
    new_heights = []
    for i in range(NUM_BARS):
        start = i * segment_size
        end = start + segment_size
        segment = chunk[start:end]
        energy = np.mean(np.abs(segment))
        new_heights.append(energy * 6)

    # --- Smooth ---
    for i in range(NUM_BARS):
        target = new_heights[i]
        bar_heights[i] = SMOOTHING * bar_heights[i] + (1 - SMOOTHING) * target
        bar_heights[i] = min(bar_heights[i], 1.5)

    # --- Kreslení ---
    screen.fill((10, 10, 20))

    max_possible_height = HEIGHT // 2 - 60

    for i, h in enumerate(bar_heights):
        x = i * bar_width  # float

        # OŘÍZNUTÁ VÝŠKA → VŽDY INT!
        scaled_h = h * BAR_SCALE
        height = int(max_possible_height * min(scaled_h, 1.0))

        # Barva
        ratio = i / (NUM_BARS - 1)
        r = int(255 * ratio)
        g = int(255 * (1 - abs(ratio - 0.5) * 2))
        b = int(255 * (1 - ratio))
        color = (r, g, b)

        # RECT S INT → FUNGUJE!
        top_rect = (int(x), HEIGHT//2 - height, int(bar_width), height)
        bot_rect = (int(x), HEIGHT//2, int(bar_width), height)
        pygame.draw.rect(screen, color, top_rect)
        pygame.draw.rect(screen, color, bot_rect)

    # --- UI ---
    title = font.render(os.path.basename(SONG_PATH), True, (200, 200, 255))
    screen.blit(title, (10, 10))

    mins, secs = divmod(int(pos_sec), 60)
    total_m, total_s = divmod(int(duration), 60)
    time_str = f"{mins:02}:{secs:02} / {total_m:02}:{total_s:02}"
    time_txt = font.render(time_str, True, (180, 180, 220))
    screen.blit(time_txt, (10, 40))

    # Progress bar
    bar_w = WIDTH - 20
    filled = int(bar_w * progress)
    pygame.draw.rect(screen, (50, 50, 80), (10, 80, bar_w, 8))
    pygame.draw.rect(screen, (100, 200, 255), (10, 80, filled, 8))

    # --- Eventy ---
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()