import { useMemo, useRef } from "react";

// Display-only highlighting. SQL execution always receives the untouched value.
const tokens =
  /(--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|\b(?:ALTER|TABLE|RENAME|COLUMN|TO|ADD|DROP|NOT|NULL|DEFAULT|UPDATE|SET|WHERE|CREATE|OR|REPLACE|FUNCTION|RETURNS|TRIGGER|AS|BEGIN|END|IF|THEN|ELSE|ELSIF|RETURN|NEW|OLD|IS|DISTINCT|FROM|AND|ON|BEFORE|INSERT|FOR|EACH|ROW|EXECUTE|LANGUAGE|SELECT|INTO|USING|TYPE|NUMERIC|INTEGER|TEXT|VALUES|COALESCE|AFTER|DELETE)\b|\b\d+(?:\.\d+)?\b)/gi;

export function SqlEditor({
  value,
  disabled,
  onChange,
  onRun,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onRun: () => void;
}) {
  const gutter = useRef<HTMLDivElement>(null);
  const paint = useRef<HTMLPreElement>(null);
  const highlighted = useMemo(
    () =>
      value.split(tokens).map((part, i) => {
        if (i % 2 === 0) return part;
        const kind =
          part.startsWith("--") || part.startsWith("/*")
            ? "comment"
            : /^["']/.test(part)
              ? "string"
              : /^\d/.test(part)
                ? "number"
                : "keyword";
        return (
          <span key={i} className={`sql-${kind}`}>
            {part}
          </span>
        );
      }),
    [value],
  );
  return (
    <div className="editor-wrap">
      <div ref={gutter} aria-hidden="true" className="line-numbers">
        {value.split("\n").map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <div className="sql-input">
        <pre ref={paint} className="sql-highlight" aria-hidden="true">
          {highlighted}
          {"\n"}
        </pre>
        <textarea
          id="migration"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          maxLength={20000}
          value={value}
          disabled={disabled}
          aria-describedby="sql-note"
          aria-keyshortcuts="Control+Enter Meta+Enter"
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (gutter.current)
              gutter.current.scrollTop = e.currentTarget.scrollTop;
            if (paint.current) {
              paint.current.scrollTop = e.currentTarget.scrollTop;
              paint.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          onKeyDown={(e) => {
            if (
              (e.metaKey || e.ctrlKey) &&
              e.key === "Enter" &&
              !disabled &&
              value.trim()
            ) {
              e.preventDefault();
              onRun();
            }
          }}
        />
      </div>
    </div>
  );
}
