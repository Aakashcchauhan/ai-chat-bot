import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, copyToClipboard, downloadAsFile } from '@/lib/utils';
import { RoadmapVisualization } from './RoadmapVisualization';




export const Message = ({ message }) => {
  const [copiedCode, setCopiedCode] = React.useState(null);
  const [selectedModule, setSelectedModule] = React.useState(null);
  const [showTopics, setShowTopics] = React.useState(false);
  const isUser = message.role === 'user';

  // Detect if message contains roadmap JSON
  const detectRoadmap = (content) => {
    try {
      // Look for JSON blocks that contain roadmap structure
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        
        // Check for flat structure (new format)
        if (parsed.title && parsed.modules && Array.isArray(parsed.modules)) {
          return { roadmap: parsed, rawJson: jsonMatch[1] };
        }
        
        // Check for nested structure (old format)
        const firstKey = Object.keys(parsed)[0];
        if (firstKey && parsed[firstKey]?.modules && Array.isArray(parsed[firstKey].modules)) {
          return { roadmap: parsed[firstKey], rawJson: jsonMatch[1] };
        }
      }
      
      // Also try parsing if no code block
      const parsed = JSON.parse(content);
      
      // Check for flat structure (new format)
      if (parsed.title && parsed.modules && Array.isArray(parsed.modules)) {
        return { roadmap: parsed, rawJson: content };
      }
      
      // Check for nested structure (old format)
      const firstKey = Object.keys(parsed)[0];
      if (firstKey && parsed[firstKey]?.modules && Array.isArray(parsed[firstKey].modules)) {
        return { roadmap: parsed[firstKey], rawJson: content };
      }
    } catch (error) {
      // Not a roadmap or invalid JSON
      console.debug('Not a roadmap:', error);
    }
    return null;
  };

  const roadmapData = !isUser ? detectRoadmap(message.content) : null;

  const handleCopyCode = async (code, language) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(language);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleDownloadCode = (code, language) => {
    const extensions = {
      // JavaScript & TypeScript
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      js: 'js',
      ts: 'ts',
      
      // Web markup & styling
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      xml: 'xml',
      svg: 'svg',
      
      // Backend languages
      python: 'py',
      py: 'py',
      java: 'java',
      kotlin: 'kt',
      scala: 'scala',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      csharp: 'cs',
      'c#': 'cs',
      cpp: 'cpp',
      'c++': 'cpp',
      c: 'c',
      
      // Shell & config
      bash: 'sh',
      shell: 'sh',
      sh: 'sh',
      powershell: 'ps1',
      dockerfile: 'dockerfile',
      yaml: 'yaml',
      yml: 'yml',
      json: 'json',
      toml: 'toml',
      ini: 'ini',
      
      // Database
      sql: 'sql',
      postgresql: 'sql',
      mysql: 'sql',
      mongodb: 'js',
      
      // Other
      markdown: 'md',
      graphql: 'graphql',
      plaintext: 'txt',
      text: 'txt',
    };
    const ext = extensions[language.toLowerCase()] || 'txt';
    const filename = `code-${Date.now()}.${ext}`;
    downloadAsFile(code, filename);
  };

  // Render roadmap if detected
  if (roadmapData && !isUser) {
    return (
      <div className="flex w-full mb-4 message-enter">
        <div className="w-full rounded-lg px-6 py-4 shadow-lg bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-start gap-2 mb-4">
            <div className="flex-1">
              <div className="text-xs font-semibold opacity-70 mb-1 text-gray-600 dark:text-gray-400">
                AI Assistant
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {roadmapData.roadmap.title}
              </h3>
              {roadmapData.roadmap.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {roadmapData.roadmap.description}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                copyToClipboard(roadmapData.rawJson);
                setCopiedCode('roadmap');
                setTimeout(() => setCopiedCode(null), 2000);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2"
              title="Copy roadmap JSON"
            >
              {copiedCode === 'roadmap' ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>

          {/* Roadmap Visualization */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
            <RoadmapVisualization
              data={roadmapData.roadmap}
              onModuleSelect={(module) => setSelectedModule(module)}
              selectedModuleId={selectedModule?.id}
              darkMode={typeof window !== 'undefined' && document.documentElement.classList.contains('dark')}
            />
          </div>

          {/* All Modules List - Always Visible */}
          <div className="space-y-4">
            {roadmapData.roadmap.modules.map((module) => (
              <div 
                key={module.id} 
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  selectedModule?.id === module.id 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700" 
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                )}
              >
                {/* Module Header */}
                <div className="mb-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {module.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {module.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>⏱️ {module.duration}</span>
                  </div>
                </div>

                {/* Topics List - Always Shown */}
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Topics Covered:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {module.topics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                {module.prerequisites && module.prerequisites.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Prerequisites:</h5>
                    <div className="flex flex-wrap gap-2">
                      {module.prerequisites.map((prereqId) => {
                        const prereq = roadmapData.roadmap.modules.find((m) => m.id === prereqId);
                        return prereq ? (
                          <span 
                            key={prereqId}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {prereq.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular message rendering
  return (
    <div
      className={cn(
        'flex w-full mb-4 message-enter',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-5 py-4 shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-900 dark:text-slate-100'
        )}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <div className={cn(
              "text-xs font-semibold mb-1",
              isUser ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'
            )}>
              {isUser ? 'You' : 'AI Assistant'}
            </div>
          </div>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const code = String(children).replace(/\n$/, '');
                const inline = !className;

                if (!inline && language) {
                  return (
                    <div className="code-block relative group my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
                        <span className="text-xs text-slate-400 font-mono font-medium uppercase tracking-wide">
                          {language}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopyCode(code, language)}
                            className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-md"
                            title="Copy code"
                          >
                            {copiedCode === language ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadCode(code, language)}
                            className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-md"
                            title="Download code"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: 0,
                          fontSize: '0.875rem',
                        }}
                        {...props}
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                return (
                  <code
                    className={cn(
                      'bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-sm font-mono text-indigo-600 dark:text-indigo-400',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

