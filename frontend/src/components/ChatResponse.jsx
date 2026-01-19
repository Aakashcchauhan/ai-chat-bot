import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Download } from 'lucide-react';

// Utility functions (you can move these to @/lib/utils if needed)
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

const downloadAsFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ChatResponse({ content }) {
  const [copiedCode, setCopiedCode] = React.useState(null);

  const handleCopyCode = async (code, language) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(language);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleDownloadCode = (code, language) => {
    const ext = (language || 'txt').toLowerCase();
    const filename = `code-${Date.now()}.${ext}`;
    downloadAsFile(code, filename);
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');
            const isInline = inline || !className;

            if (!isInline && language) {
              return (
                <div className="code-block relative group my-4 rounded-xl overflow-hidden border border-slate-700 bg-transparent">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-300 font-mono font-medium uppercase tracking-wide">
                      {language}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCopyCode(code, language)}
                        className="text-slate-300 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-md"
                        title="Copy code"
                        aria-label={`Copy ${language} code`}
                      >
                        {copiedCode === language ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => handleDownloadCode(code, language)}
                        className="text-slate-300 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-md"
                        title="Download code"
                        aria-label={`Download ${language} code`}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto px-4 py-4 bg-slate-900 w-full">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: 8,
                        fontSize: '0.875rem',
                        backgroundColor: 'transparent',
                        padding: 0,
                        display: 'block',
                        width: '100%',
                        whiteSpace: 'pre',
                      }}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              );
            }

            return (
              <code
                className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-sm font-mono text-indigo-600 dark:text-indigo-400"
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Demo usage
function App() {
  const sampleMarkdown = `# Chat Response Demo

Here's some **bold text** and *italic text*.

## Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to the chat, \${name}!\`;
}

greet('World');
\`\`\`

And here's some inline code: \`const x = 42;\`

\`\`\`python
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

print(calculate_fibonacci(10))
\`\`\`

- Bullet point 1
- Bullet point 2
- Bullet point 3
`;

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-lg p-6 shadow-xl">
          <ChatResponse content={sampleMarkdown} />
        </div>
      </div>
    </div>
  );
}