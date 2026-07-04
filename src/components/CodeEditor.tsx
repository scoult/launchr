import CodeMirror from "@uiw/react-codemirror";
import { xml } from "@codemirror/lang-xml";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";

// Well-formedness check via the browser's XML parser (no parser dependency).
export function isXmlValid(text: string): boolean {
  if (!text.trim()) return false;
  const parsed = new DOMParser().parseFromString(text, "application/xml");
  return !parsed.querySelector("parsererror");
}

// CodeMirror linter: surfaces XML parse errors inline, placed at the reported
// line/column when the parser gives one, else at the top of the document.
const xmlLinter = linter((view) => {
  const text = view.state.doc.toString();
  if (!text.trim()) return [];
  const parsed = new DOMParser().parseFromString(text, "application/xml");
  const err = parsed.querySelector("parsererror");
  if (!err) return [];

  const message = (err.textContent || "Invalid XML").replace(/\s+/g, " ").trim();
  const doc = view.state.doc;
  let from = 0;
  let to = Math.min(doc.length, doc.line(1).to);

  const lineMatch = message.match(/line (\d+)/i);
  const colMatch = message.match(/column (\d+)/i);
  if (lineMatch) {
    const ln = Math.min(Math.max(1, parseInt(lineMatch[1], 10)), doc.lines);
    const line = doc.line(ln);
    const col = colMatch
      ? Math.min(line.length, Math.max(0, parseInt(colMatch[1], 10) - 1))
      : 0;
    from = line.from + col;
    to = line.to;
    if (from >= to) from = line.from;
  }

  const diag: Diagnostic = { from, to, severity: "error", message };
  return [diag];
});

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  height = "100%",
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}) {
  return (
    <CodeMirror
      value={value}
      height={height}
      // Fill the wrapper so a height of "100%" has a definite box to resolve
      // against (otherwise CodeMirror grows to content height and gets clipped).
      style={{ height }}
      className={className}
      theme="dark"
      editable={!readOnly}
      readOnly={readOnly}
      extensions={readOnly ? [xml()] : [xml(), xmlLinter, lintGutter()]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: !readOnly,
      }}
    />
  );
}
