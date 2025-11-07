import google.generativeai as genai
import os

# Configure with your API key
genai.configure(api_key="AIzaSyAFPTjeJLl3jPdLSm8MnKGeatHgTlEiPhw")

print("Available Gemini Models:")
print("-" * 50)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✓ {model.name}")
        print(f"  Description: {model.description}")
        print(f"  Supported methods: {', '.join(model.supported_generation_methods)}")
        print()

os.system("curl http://localhost:8000/docs")
