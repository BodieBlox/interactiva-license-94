
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { RobloxUserDisplay, RobloxGameDisplay, RobloxRevenueDisplay } from './RobloxDataDisplay';

interface AIResponseEmbedProps {
  content: string;
  isAdminAction?: boolean;
}

export const AIResponseEmbed = ({ content, isAdminAction }: AIResponseEmbedProps) => {
  const [processedContent, setProcessedContent] = useState(content);
  const [robloxUserData, setRobloxUserData] = useState<any>(null);
  const [robloxGameData, setRobloxGameData] = useState<any>(null);
  const [robloxRevenueData, setRobloxRevenueData] = useState<any>(null);

  useEffect(() => {
    // Extract any Roblox JSON data from the content
    // This relies on a specific format coming from the AI
    const extractRobloxData = () => {
      try {
        // Format: ```roblox-user-data\n{...}\n```
        const userDataMatch = content.match(/```roblox-user-data\n([\s\S]*?)\n```/);
        if (userDataMatch && userDataMatch[1]) {
          const userData = JSON.parse(userDataMatch[1]);
          setRobloxUserData(userData);
          console.log("Extracted Roblox user data:", userData);
        }

        // Format: ```roblox-game-data\n{...}\n```
        const gameDataMatch = content.match(/```roblox-game-data\n([\s\S]*?)\n```/);
        if (gameDataMatch && gameDataMatch[1]) {
          const gameData = JSON.parse(gameDataMatch[1]);
          setRobloxGameData(gameData);
          console.log("Extracted Roblox game data:", gameData);
        }

        // Format: ```roblox-revenue-data\n{...}\n```
        const revenueDataMatch = content.match(/```roblox-revenue-data\n([\s\S]*?)\n```/);
        if (revenueDataMatch && revenueDataMatch[1]) {
          const revenueData = JSON.parse(revenueDataMatch[1]);
          setRobloxRevenueData(revenueData);
          console.log("Extracted Roblox revenue data:", revenueData);
        }

        // Remove the JSON blocks from the content
        let cleanedContent = content
          .replace(/```roblox-user-data\n[\s\S]*?\n```/g, '')
          .replace(/```roblox-game-data\n[\s\S]*?\n```/g, '')
          .replace(/```roblox-revenue-data\n[\s\S]*?\n```/g, '')
          .trim();

        setProcessedContent(cleanedContent);
      } catch (error) {
        console.error("Error processing Roblox data:", error);
        setProcessedContent(content); // Use original content if there's an error
      }
    };

    extractRobloxData();
  }, [content]);

  return (
    <div className="whitespace-pre-wrap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-2"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} px-1 py-0.5 bg-muted rounded text-sm`} {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/50">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="border-b border-border">{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left font-medium">{children}</th>
            );
          },
          td({ children }) {
            return <td className="px-4 py-2">{children}</td>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Display Roblox data if available */}
      {robloxUserData && <RobloxUserDisplay user={robloxUserData} />}
      {robloxGameData && <RobloxGameDisplay game={robloxGameData} />}
      {robloxRevenueData && <RobloxRevenueDisplay revenue={robloxRevenueData} />}
    </div>
  );
};
