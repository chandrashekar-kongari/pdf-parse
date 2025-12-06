"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ParseMethod, ParseResults, PARSE_METHOD_LABELS } from "./types";
import { ParseResultDisplay } from "./ParseResultDisplay";

interface ParseResultsTabsProps {
  activeTab: ParseMethod;
  onTabChange: (tab: ParseMethod) => void;
  parseResults: ParseResults;
  isParsing: Record<ParseMethod, boolean>;
}

export function ParseResultsTabs({
  activeTab,
  onTabChange,
  parseResults,
  isParsing,
}: ParseResultsTabsProps) {
  const methods: ParseMethod[] = ["pdfParse", "openai", "reducto"];

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as ParseMethod)}
    >
      <TabsList className="grid w-full grid-cols-3">
        {methods.map((method) => (
          <TabsTrigger key={method} value={method}>
            {PARSE_METHOD_LABELS[method]}
          </TabsTrigger>
        ))}
      </TabsList>

      {methods.map((method) => (
        <TabsContent key={method} value={method} className="mt-4">
          <ParseResultDisplay
            method={method}
            result={parseResults[method]}
            isParsing={isParsing[method]}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
