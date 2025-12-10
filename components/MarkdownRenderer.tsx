import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-lg prose-slate max-w-none font-serif text-slate-800 leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-indigo-900 mt-8 mb-4" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 text-justify" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-indigo-950" {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-indigo-500 pl-4 italic bg-slate-50 py-2 pr-2 my-6 rounded-r text-slate-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
