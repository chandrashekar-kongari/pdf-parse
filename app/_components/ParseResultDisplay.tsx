"use client";

import { ParseMethod, PARSE_METHOD_LABELS } from "./types";

interface ParseResultDisplayProps {
  method: ParseMethod;
  result: string | null;
  isParsing: boolean;
}

export function ParseResultDisplay({
  method,
  result,
  isParsing,
}: ParseResultDisplayProps) {
  const label = PARSE_METHOD_LABELS[method];

  if (isParsing) {
    return (
      <div className="p-4 border border-input rounded-md bg-background">
        <p className="text-sm text-muted-foreground">
          Parsing with {label}(might take a while)...
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="p-4 border border-input rounded-md bg-background">
        <h3 className="text-sm font-semibold mb-2">{label} Parse Result:</h3>
        <pre className="text-sm whitespace-pre-wrap wrap-break-word max-h-96 overflow-y-auto">
          {result}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-4 border border-input rounded-md bg-background">
      <p className="text-sm text-muted-foreground">
        Parsing will start automatically...
      </p>
    </div>
  );
}
