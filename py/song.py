# --------------------------------------------------------------
#  Pure-Python audio visualizer (pygame + numpy + pydub)
# --------------------------------------------------------------
#  1. Put red_giant.mp3 in the same folder as this script
#  2. pip install pygame numpy pydub
#  3. Run:  python song.py
# --------------------------------------------------------------

import os
import queue
import threading
import time
import numpy as np
import pygame
from pydub import AudioSegment

# -------------------------- CONFIG -----------------------------
WIDTH, HEIGHT = 1200, 600
FPS = 60
AUDIO_FILE = "../song.mp3"          # change if you like
BAND_AMPLITUDE = 200
BAND_THICKNESS = 2
CHUNK_SIZE = 1024                     # same size as Processing buffer
# --------------------------------------------------------------

pygame.init()
pygame.mixer.pre_init(frequency=44100, size=-16, channels=2, buffer=CHUNK_SIZE)
pygame.mixer.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Python Audio Visualizer")
clock = pygame.time.Clock()
font = pygame.font.SysFont("Arial", 18)

# --------------------------------------------------------------
# 1. Load the file with pydub → raw PCM (int16) → float32 [-1, 1]
# --------------------------------------------------------------
if not os.path.exists(AUDIO_FILE):
    raise FileNotFoundError(f"Audio file not found: {AUDIO_FILE}")

audio = AudioSegment.from_file(AUDIO_FILE)
audio = audio.set_channels(2).set_frame_rate(44100).set_sample_width(2)  # 16-bit
samples_i16 = np.array(audio.get_array_of_samples(), dtype=np.int16)

# convert to float32 in [-1, 1]
samples_f32 = samples_i16.astype(np.float32) / 32768.0

# separate left / right / mix
left  = samples_f32[0::2]
right = samples_f32[1::2]
mix   = (left + right) / 2

# --------------------------------------------------------------
# 2. Feed the same data to pygame.mixer (Sound object)
# --------------------------------------------------------------
raw_bytes = samples_i16.tobytes()
sound = pygame.mixer.Sound(buffer=raw_bytes)

# --------------------------------------------------------------
# 3. Thread that keeps track of the *exact* playback position
# --------------------------------------------------------------
playback_pos = 0                # index in the *mix* array
pos_lock = threading.Lock()
stop_thread = threading.Event()

def _position_watcher():
    """Runs in a background thread and updates playback_pos."""
    global playback_pos
    start = time.time()
    while not stop_thread.is_set():
        if pygame.mixer.get_busy():
            # time elapsed since start of this play
            elapsed = time.time() - start
            # samples played = elapsed * sample_rate
            pos = int(elapsed * 44100) % len(mix)
            with pos_lock:
                playback_pos = pos
        else:
            # paused or finished – keep last position
            time.sleep(0.01)

thread = threading.Thread(target=_position_watcher, daemon=True)
thread.start()

# --------------------------------------------------------------
# 4. Helper to get the current 1024-sample window
# --------------------------------------------------------------
def current_window():
    """Return the CHUNK_SIZE-sample window that is playing right now."""
    with pos_lock:
        pos = playback_pos
    chunk = mix[pos:pos+CHUNK_SIZE]
    if len(chunk) < CHUNK_SIZE:
        chunk = np.concatenate((chunk, mix[:CHUNK_SIZE-len(chunk)]))
    return chunk

# --------------------------------------------------------------
# 5. Play the sound (will be restarted when it ends)
# --------------------------------------------------------------
channel = sound.play(loops=-1)          # loop forever
paused = False

# --------------------------------------------------------------
# 6. Main loop
# --------------------------------------------------------------
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_q:
                running = False
            if event.key == pygame.K_SPACE:
                if paused:
                    sound.resume()
                    paused = False
                else:
                    sound.pause()
                    paused = True

    # ----------------------------------------------------------
    # Grab the live CHUNK_SIZE-sample window
    # ----------------------------------------------------------
    window = current_window()               # shape (1024,)

    # ----------------------------------------------------------
    # Draw
    # ----------------------------------------------------------
    screen.fill((0, 0, 0))

    # ----- LEFT channel (green) -----
    for i in range(0, CHUNK_SIZE, 2):
        x = 50 + i / CHUNK_SIZE * (WIDTH * 0.3)
        y_center = HEIGHT // 2
        amp = left[(playback_pos + i) % len(left)] * BAND_AMPLITUDE
        y1 = y_center - amp - BAND_THICKNESS
        y2 = y_center - amp + BAND_THICKNESS
        pygame.draw.line(screen, (0, 255, 0), (int(x), int(y1)), (int(x), int(y2)), 2)

    # ----- RIGHT channel (red) -----
    for i in range(0, CHUNK_SIZE, 2):
        x = WIDTH - 50 - i / CHUNK_SIZE * (WIDTH * 0.3)
        y_center = HEIGHT // 2
        amp = right[(playback_pos + i) % len(right)] * BAND_AMPLITUDE
        y1 = y_center - amp - BAND_THICKNESS
        y2 = y_center - amp + BAND_THICKNESS
        pygame.draw.line(screen, (255, 0, 0), (int(x), int(y1)), (int(x), int(y2)), 2)

    # ----- MIX (center bottom, yellow) -----
    for i, val in enumerate(window):
        x = WIDTH * 0.3 + i / CHUNK_SIZE * (WIDTH * 0.4)
        y_center = int(HEIGHT * 0.75)
        h = abs(val) * BAND_AMPLITUDE
        pygame.draw.line(screen,
                         (255, 255, 0),
                         (int(x), int(y_center - h)),
                         (int(x), int(y_center + h)),
                         2)

    # ----- Status text -----
    status = "PLAYING" if pygame.mixer.get_busy() and not paused else "PAUSED"
    txt = font.render(f"{status}  |  SPACE = play/pause  |  Q = quit", True, (255, 255, 255))
    screen.blit(txt, (10, 10))

    pygame.display.flip()
    clock.tick(FPS)

# --------------------------------------------------------------
stop_thread.set()
thread.join()
pygame.quit()