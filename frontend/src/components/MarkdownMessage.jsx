import React from "react";

export const MarkdownMessage = ({ content, onCopyCode, copiedIndex }) => {
  if (!content) return null;

  // Split content by triple backticks for code blocks
  const parts = content.split(/```/g);

  return (
    <div className="prose">
      {parts.map((part, index) => {
        // Even indices are text blocks, odd indices are code blocks
        if (index % 2 !== 0) {
          // Extract language and code content
          const lines = part.split("\n");
          let lang = lines[0] ? lines[0].trim().toLowerCase() : "code";
          
          // In case language is not specified and code starts on line 1
          let codeStartIndex = 1;
          if (lang.match(/^[a-zA-Z0-9#+-]+$/) === null || lang === "") {
            lang = "code";
            codeStartIndex = 0;
          }
          
          const codeText = lines.slice(codeStartIndex).join("\n").trim();
          const blockId = `code-block-${index}`;

          return (
            <pre key={index}>
              <div className="code-header">
                <span className="code-lang">{lang}</span>
                <button 
                  className="code-copy-btn" 
                  onClick={() => onCopyCode(codeText, blockId)}
                >
                  {copiedIndex === blockId ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code>{codeText}</code>
            </pre>
          );
        } else {
          // Format regular text (handles newlines, bullets, and bold markers)
          const subLines = part.split("\n\n");
          return subLines.map((subLine, lineIdx) => {
            const trimmed = subLine.trim();
            if (!trimmed) return null;

            // Handle lists (lines starting with - or * or digit.)
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^\d+\.\s/)) {
              const items = trimmed.split(/\n/);
              return (
                <ul key={`${lineIdx}-${index}`} style={{ marginBottom: "16px" }}>
                  {items.map((item, itemIdx) => {
                    const cleanItem = item.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
                    return <li key={itemIdx}>{parseInlineFormatting(cleanItem)}</li>;
                  })}
                </ul>
              );
            }

            // Handle Blockquotes
            if (trimmed.startsWith(">")) {
              const quoteContent = trimmed.replace(/^>\s*/, "");
              return (
                <blockquote key={`${lineIdx}-${index}`}>
                  <p>{parseInlineFormatting(quoteContent)}</p>
                </blockquote>
              );
            }

            // Standard paragraph
            return (
              <p key={`${lineIdx}-${index}`}>
                {parseInlineFormatting(trimmed)}
              </p>
            );
          });
        }
      })}
    </div>
  );
};

// Parses bold **bold** and inline `code`
const parseInlineFormatting = (text) => {
  if (!text) return "";
  
  // Split by bold patterns
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  
  return boldParts.map((boldPart, idx) => {
    if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
      const innerBold = boldPart.slice(2, -2);
      return <strong key={idx}>{parseInlineCode(innerBold)}</strong>;
    }
    return parseInlineCode(boldPart);
  });
};

const parseInlineCode = (text) => {
  const codeParts = text.split(/(`.*?`)/g);
  return codeParts.map((codePart, idx) => {
    if (codePart.startsWith("`") && codePart.endsWith("`")) {
      return <code key={idx}>{codePart.slice(1, -1)}</code>;
    }
    return codePart;
  });
};
