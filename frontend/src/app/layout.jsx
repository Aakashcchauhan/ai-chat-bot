import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ClientLayout } from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI Code Generator - Chatbot',
  description: 'AI-powered code generation chatbot using Gemini',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen` }>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
