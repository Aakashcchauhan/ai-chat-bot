#!/bin/bash

# Setup Script for AI Code Generator Chatbot

echo "====================================="
echo "AI Code Generator - Setup Script"
echo "====================================="
echo ""

# Check Python installation
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python found: $PYTHON_VERSION"
else
    echo "✗ Python not found! Please install Python 3.9+"
    exit 1
fi

# Check Node.js installation
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js found: $NODE_VERSION"
else
    echo "✗ Node.js not found! Please install Node.js 18+"
    exit 1
fi

echo ""
echo "====================================="
echo "Setting up Backend..."
echo "====================================="

# Backend setup
cd backend

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo "⚠ Please edit backend/.env and add your OpenAI API key!"
else
    echo "✓ .env file already exists"
fi

cd ..

echo ""
echo "====================================="
echo "Setting up Frontend..."
echo "====================================="

# Frontend setup
cd frontend

echo "Installing Node.js dependencies..."
npm install

echo "Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "✓ Created .env.local file"
else
    echo "✓ .env.local file already exists"
fi

cd ..

echo ""
echo "====================================="
echo "Setup Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your OpenAI API key"
echo "2. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
