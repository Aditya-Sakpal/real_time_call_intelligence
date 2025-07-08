import sounddevice as sd
from scipy.io.wavfile import write
import keyboard
import time
from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def record_audio():
    print("Press Enter to start recording...")
    keyboard.wait('enter')
    print("Press Enter again to stop recording...")

    start_time = time.time()

    fs = 44100
    channels = 2

    recording = sd.rec(int(fs*300), samplerate=fs, channels=channels)
    keyboard.wait('enter')
    print("Stopping recording...")
    print()

    sd.stop()

    duration = time.time() - start_time
    write("output.wav", fs, recording[:int(fs*duration)])

def transcribe_audio(file_path):
    with open(file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    return transcription.text

if __name__ == "__main__":
    while True:
        record_audio()
        text = transcribe_audio("output.wav")
        print(f"Transcription: {text}")
        print()
        time.sleep(1)