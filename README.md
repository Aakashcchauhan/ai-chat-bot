# 🤖 AI Code Generator

An intelligent code generation chatbot powered by Google Gemini AI, built with FastAPI and Next.js.

![AI Code Generator](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black)
![Firebase](https://img.shields.io/badge/Auth-Firebase-orange)

## ✨ Features

- 🎯 **4 Intelligent Modes**
  - 💻 **Code Generation** - Generate production-ready code
  - 💬 **Chat** - General programming questions
  - 📖 **Explain** - Detailed concept explanations
  - 🗺️ **Roadmap** - Visual learning paths

- 🔐 **Secure Authentication**
  - Email/Password authentication
  - Google OAuth integration
  - Firebase security rules

- 💾 **Persistent Chat History**
  - Firestore database integration
  - Real-time synchronization
  - Chat organization by mode

- 🎨 **Responsive Design**
  - Mobile-first approach
  - Tablet optimization
  - Desktop-optimized layout
  - Dark mode support

- ⌨️ **Keyboard Shortcuts**
  - `Ctrl/Cmd + B` - Toggle sidebar
  - `Enter` - Send message
  - `Shift + Enter` - New line

- 🚀 **Advanced Features**
  - Real-time streaming responses
  - Syntax highlighting for code
  - Copy-to-clipboard functionality
  - Download generated code
  - Interactive roadmap visualization

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Google Gemini AI** - gemini-2.5-flash-latest model
- **Firebase Admin SDK** - Authentication & Firestore
- **Uvicorn** - Lightning-fast ASGI server
- **Python 3.9+** - Modern Python features

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Firebase JS SDK** - Client-side authentication
- **react-markdown** - Markdown rendering
- **rehype-highlight** - Syntax highlighting

## 📦 Installation

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- Firebase project with Authentication & Firestore
- Google Gemini API key

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and add your credentials:
# - GEMINI_API_KEY=your_gemini_api_key
# - FIREBASE_CREDENTIALS_PATH=firebase-credentials.json

# Add Firebase credentials
# Download firebase-credentials.json from Firebase Console
# Place it in backend/ directory

# Run the server
python main.py