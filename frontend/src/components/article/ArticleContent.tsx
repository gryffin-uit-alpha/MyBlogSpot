'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const components: Components = {
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const inline = !language;

      return !inline ? (
        <SyntaxHighlighter
          style={tomorrow as any}
          language={language}
          PreTag="div"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    img({ node, className, src, alt, ...props }: any) {
      // Raw HTML images inserted via layout templates (img-small, img-left, ...)
      // keep their own classes; markdown-images.css keeps them inside the card.
      if (className) {
        return <img src={src} alt={alt || ''} className={className} loading="lazy" {...props} />;
      }

      // Plain Markdown images ![alt](url): render as a centered, responsive block.
      // <span> is used (not <figure>) because the image sits inside a <p>.
      return (
        <span className="md-figure">
          <img src={src} alt={alt || ''} loading="lazy" {...props} />
        </span>
      );
    },
  };

  return (
    <div className="article-content prose prose-invert prose-lg max-w-none text-gray-200 leading-relaxed font-body">
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
