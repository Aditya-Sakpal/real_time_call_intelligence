import sounddevice as sd
from scipy.io.wavfile import write
import keyboard
import time
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
from textblob import TextBlob

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def record_audio():
    print("Press Enter to start recording...")
    keyboard.wait('enter')
    print("Recording... Press Enter again to stop...")

    fs = 44100
    channels = 2
    start_time = time.time()

    recording = sd.rec(int(fs*300), samplerate=fs, channels=channels)
    keyboard.wait('enter')
    sd.stop()

    duration = time.time() - start_time
    write("output.wav", fs, recording[:int(fs*duration)])
    return duration

def transcribe_audio(file_path):
    with open(file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    return transcription.text

def analyze_sentiment(text):
    # Using TextBlob for simplicity (or use the OpenAI version above)
    analysis = TextBlob(text)
    sentiment = "neutral"
    
    if analysis.sentiment.polarity > 0.1:
        sentiment = "positive"
    elif analysis.sentiment.polarity < -0.1:
        sentiment = "negative"
    
    return {
        "sentiment": sentiment,
        "polarity": analysis.sentiment.polarity,
        "subjectivity": analysis.sentiment.subjectivity,
        "confidence": abs(analysis.sentiment.polarity)
    }

def get_coaching_recommendation(sentiment_analysis):
    sentiment = sentiment_analysis.get('sentiment', 'neutral')
    confidence = sentiment_analysis.get('confidence', 0)
    
    if sentiment == "negative" and confidence > 0.3:
        return "⚠️ Customer seems unhappy. Consider apologizing and offering solutions."
    elif sentiment == "positive" and confidence > 0.3:
        return "✅ Customer is happy! Consider upselling or asking for feedback."
    elif sentiment == "negative":
        return "➖ Customer may be slightly dissatisfied. Check for understanding."
    else:
        return "➡️ Keep the conversation going. Ask open-ended questions."

if __name__ == "__main__":
    try:
        while True:
            duration = record_audio()
            text = transcribe_audio("output.wav")
            
            print(f"\nDuration: {duration:.1f} seconds")
            print(f"Transcription: {text}")
            
            sentiment = analyze_sentiment(text)
            print("\nSentiment Analysis:")
            print(f"- Sentiment: {sentiment['sentiment'].upper()}")
            print(f"- Polarity: {sentiment['polarity']:.2f} (Range: -1 to 1)")
            print(f"- Subjectivity: {sentiment['subjectivity']:.2f} (0=factual, 1=opinion)")
            
            recommendation = get_coaching_recommendation(sentiment)
            print(f"\nRecommendation: {recommendation}")
            
            print("\n" + "="*50 + "\n")
            
    except KeyboardInterrupt:
        print("\nExiting...")