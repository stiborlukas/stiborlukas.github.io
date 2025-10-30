import pygame
import numpy as np
import sounddevice as sd

# --- Settings ---
WIDTH, HEIGHT = 1000, 600
FPS = 60
BASE_AMPLITUDE = 250      # visual amplitude
SMOOTHING = 0.85          # higher = smoother, slower
LOUDNESS_SMOOTH = 0.95    # smoothing for adaptive loudness
NOISE_GATE = 0.02         # ignore anything quieter than this (0–1 range)

# --- Setup ---
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Stable Audio Visualizer")
clock = pygame.time.Clock()

SAMPLE_RATE = 44100
BUFFER_SIZE = 1024
audio_buffer = np.zeros(BUFFER_SIZE)
smoothed_waveform = np.zeros(BUFFER_SIZE)
avg_loudness = 0.1  # starting gain reference

def audio_callback(indata, frames, time, status):
    global audio_buffer
    audio_buffer = np.copy(indata[:, 0])  # left channel

# Start microphone stream
stream = sd.InputStream(callback=audio_callback, channels=2,
                        samplerate=SAMPLE_RATE, blocksize=BUFFER_SIZE)
stream.start()

running = True
while running:
    screen.fill((0, 0, 0))

    # --- Audio processing ---
    waveform = audio_buffer.copy()

    # Compute loudness (RMS)
    rms = np.sqrt(np.mean(waveform**2))
    avg_loudness = LOUDNESS_SMOOTH * avg_loudness + (1 - LOUDNESS_SMOOTH) * rms

    # Normalize relative to recent loudness, not instant peak
    if avg_loudness > 1e-4:
        waveform /= (avg_loudness * 10)

    # Apply noise gate
    waveform[np.abs(waveform) < NOISE_GATE] = 0

    # Smooth motion
    smoothed_waveform = SMOOTHING * smoothed_waveform + (1 - SMOOTHING) * waveform

    # Convert to points
    points = []
    for i, sample in enumerate(smoothed_waveform):
        x = int(WIDTH * i / BUFFER_SIZE)
        y = int(HEIGHT / 2 - sample * BASE_AMPLITUDE)
        points.append((x, y))

    # Draw waveform
    if len(points) > 1:
        pygame.draw.lines(screen, (255, 255, 255), False, points, 2)

    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    pygame.display.flip()
    clock.tick(FPS)

stream.stop()
pygame.quit()

