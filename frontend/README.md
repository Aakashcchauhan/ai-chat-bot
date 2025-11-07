# Frontend README

## AI Code Generator - Frontend

Modern Next.js 14 application with TypeScript and Tailwind CSS.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   copy .env.local.example .env.local
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/       # React components
│   │   ├── ChatHeader.tsx
│   │   ├── ChatMessages.tsx
│   │   ├── ChatInput.tsx
│   │   └── Message.tsx
│   ├── lib/             # Utilities
│   │   ├── api.ts       # API client
│   │   └── utils.ts     # Helper functions
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── styles/          # Styles
│       └── globals.css
├── public/              # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Features

### 🎨 Advanced Code Preview
- **150+ Languages Supported** - All major programming languages for web development
- **Syntax Highlighting** - Beautiful VS Code Dark+ theme powered by Prism.js
- **One-Click Copy** - Copy any code block to clipboard instantly
- **Download Code** - Save code blocks as files with proper extensions
- **Smart Detection** - Automatic language detection from markdown code blocks

See [SUPPORTED_LANGUAGES.md](./SUPPORTED_LANGUAGES.md) for the complete list of supported languages.

### 🔐 Firebase Authentication
- Google Sign-In integration
- User-specific chat history
- Secure token-based authentication

### 💬 Multi-Chat Support
- Create and manage multiple chat sessions
- Per-user chat history with localStorage
- Switch between conversations seamlessly

## Components

### ChatHeader
Navigation bar with mode selector, language dropdown, and user authentication.

### ChatMessages
Displays conversation with syntax-highlighted code blocks and markdown support.

### ChatInput
Text input with send button and keyboard shortcuts (Enter to send).

### Message
Individual message with markdown rendering, code syntax highlighting, copy and download buttons.

### Sidebar
Multi-chat management with create, select, and preview features.

## Styling

Uses **Tailwind CSS** with custom theme configuration.

### Custom Colors
- Primary: Blue shades for branding
- Dark mode support included

### Responsive Design
Mobile-first approach with responsive breakpoints.

## API Integration

API calls handled via `src/lib/api.ts`:

```typescript
import { chatAPI } from '@/lib/api';

// Send message
const response = await chatAPI.sendMessage({
  message: "Your prompt",
  conversation_history: [],
  language: "python",
  mode: "code"
});
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Customization

### Change Theme
Edit `tailwind.config.js` to customize colors.

### Add Languages
Backend automatically provides language list via API.

### Modify Layout
Update `src/app/layout.tsx` for global changes.
