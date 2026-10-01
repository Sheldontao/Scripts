import { Action, ActionPanel, Clipboard, Detail, showHUD, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { Rule } from "../types/rule";
import { cleanTextWithRules } from "../utils/remove-tracking-params";
import { normalizeUrlTarget } from "../utils/rule-matcher";
import { builtinRules } from "../utils/rules";
import { listUserRules, upsertUserRule } from "../utils/user-rules-storage";
import UnknownUrlRuleForm from "./unknown-url-rule-form";

interface CleaningCommandViewProps {
  sourceLabel: string;
  readRawText: () => Promise<string | undefined>;
}

export default function CleaningCommandView(props: CleaningCommandViewProps) {
  const [rawText, setRawText] = useState<string>();
  const [rules, setRules] = useState<Rule[]>(builtinRules);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const value = await props.readRawText();
        if (!value) {
          setError(`Failed to read text from ${props.sourceLabel}`);
          return;
        }

        const userRules = await listUserRules();
        setRules([...builtinRules, ...userRules]);
        setRawText(value);
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [props]);

  const result = useMemo(() => {
    if (!rawText) {
      return undefined;
    }
    return cleanTextWithRules(rawText, rules);
  }, [rawText, rules]);

  const firstUnmatched = result?.diagnostics.find((entry) => entry.status === "no-rule");

  async function finalize(text: string, partial: boolean) {
    if (isFinalizing) {
      return;
    }
    setIsFinalizing(true);

    await Clipboard.copy(text);
    await showHUD(partial ? "Cleaning complete (partial)" : "Cleaning complete");
  }

  async function saveRuleAndReclean(allowParams: string[]) {
    if (!firstUnmatched) {
      return;
    }

    const target = normalizeUrlTarget(firstUnmatched.originalUrl);
    if (!target) {
      await showToast({ style: Toast.Style.Failure, title: "Invalid URL", message: firstUnmatched.originalUrl });
      return;
    }

    try {
      await upsertUserRule({
        name: `Rule for ${target.host}${target.path}`,
        host: target.host,
        path: target.path,
        allowParams,
      });

      const userRules = await listUserRules();
      setRules([...builtinRules, ...userRules]);
      await showHUD("Rule saved. Recleaning...");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Storage error";
      await showToast({ style: Toast.Style.Failure, title: "Failed to save rule", message });
    }
  }

  useEffect(() => {
    if (!result || firstUnmatched || isFinalizing) {
      return;
    }

    void finalize(result.cleanedText, false);
  }, [firstUnmatched, isFinalizing, result]);

  if (loading) {
    return <Detail markdown="Loading text and rules..." />;
  }

  if (error) {
    return <Detail markdown={`Failed to clean link.\n\n${error}`} />;
  }

  if (!result || result.diagnostics.length === 0) {
    return <Detail markdown="No URL found in the input text." />;
  }

  if (firstUnmatched) {
    const target = normalizeUrlTarget(firstUnmatched.originalUrl);
    if (!target) {
      return (
        <Detail
          markdown={`Found an invalid URL and skipped it: ${firstUnmatched.originalUrl}`}
          actions={
            <ActionPanel>
              <Action title="Copy Partial Result" onAction={() => finalize(result.cleanedText, true)} />
            </ActionPanel>
          }
        />
      );
    }

    if (firstUnmatched.availableParams.length === 0) {
      return (
        <Detail
          markdown={`No available rule for ${target.host}${target.path}.\n\nThis URL has no query parameters to configure.`}
          actions={
            <ActionPanel>
              <Action title="Copy Partial Result" onAction={() => finalize(result.cleanedText, true)} />
            </ActionPanel>
          }
        />
      );
    }

    return (
      <UnknownUrlRuleForm
        url={firstUnmatched.originalUrl}
        host={target.host}
        path={target.path}
        availableParams={firstUnmatched.availableParams}
        onSave={saveRuleAndReclean}
        onSkip={() => finalize(result.cleanedText, true)}
      />
    );
  }

  return <Detail markdown={`Cleaning complete. Copied to clipboard.\n\n${result.cleanedText}`} />;
}
