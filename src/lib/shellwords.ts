// Tokenize a command line into argv, respecting single/double quotes. launchd
// runs no shell, so ProgramArguments are literal argv — we only handle quoting
// and whitespace (no $var expansion). Backslash escapes `"` and `\` inside
// double quotes so joinArgs → splitArgs round-trips.

export function splitArgs(input: string): string[] {
  const args: string[] = [];
  let cur = "";
  let started = false; // distinguishes "" (a real empty arg) from no arg
  let mode: "none" | "single" | "double" = "none";

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (mode === "single") {
      if (c === "'") mode = "none";
      else cur += c;
      continue;
    }
    if (mode === "double") {
      if (c === '"') mode = "none";
      else if (c === "\\" && (input[i + 1] === '"' || input[i + 1] === "\\")) {
        cur += input[++i];
      } else cur += c;
      continue;
    }
    if (c === "'") { mode = "single"; started = true; }
    else if (c === '"') { mode = "double"; started = true; }
    else if (/\s/.test(c)) {
      if (started) { args.push(cur); cur = ""; started = false; }
    } else { cur += c; started = true; }
  }
  if (started) args.push(cur);
  return args;
}

export function joinArgs(args: string[]): string {
  return args.map(quote).join(" ");
}

function quote(a: string): string {
  if (a === "") return '""';
  if (!/[\s'"\\]/.test(a)) return a;
  if (!a.includes("'")) return `'${a}'`; // single-quote when it has no single quote
  return `"${a.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
