import { Action, ActionPanel, List, confirmAlert, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import RuleEditorForm, { RuleEditorValues } from "./components/rule-editor-form";
import { Rule } from "./types/rule";
import { ruleSubtitle } from "./utils/rule-presenter";
import { deleteUserRuleByKey, listUserRules, upsertUserRule } from "./utils/user-rules-storage";

export default function ManageUserRulesCommand() {
  const { pop, push } = useNavigation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadRules() {
    setIsLoading(true);
    const loaded = await listUserRules();
    loaded.sort((a, b) => b.updatedAt - a.updatedAt);
    setRules(loaded);
    setIsLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function openEditor(initial?: Rule) {
    await push(
      <RuleEditorForm
        initialValues={
          initial
            ? {
                name: initial.name,
                host: initial.target.host,
                path: initial.target.path,
                allowParams: initial.allowParams,
              }
            : undefined
        }
        onSave={async (values: RuleEditorValues) => {
          await upsertUserRule(values);
          await showToast({ style: Toast.Style.Success, title: "Rule saved" });
          await loadRules();
          pop();
        }}
      />,
    );
  }

  async function removeRule(rule: Rule) {
    const confirmed = await confirmAlert({
      title: "Delete Rule",
      message: `Delete ${rule.target.host}${rule.target.path}?`,
    });
    if (!confirmed) {
      return;
    }

    await deleteUserRuleByKey(rule.target.key);
    await showToast({ style: Toast.Style.Success, title: "Rule deleted" });
    await loadRules();
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search user rules by host/path"
      actions={
        <ActionPanel>
          <Action title="Create Rule" onAction={() => openEditor()} />
        </ActionPanel>
      }
    >
      {rules.length === 0 ? (
        <List.EmptyView title="No user rules yet" description="Create one to start customizing cleaning." />
      ) : null}

      {rules.map((rule) => (
        <List.Item
          key={rule.target.key}
          title={`${rule.target.host}${rule.target.path}`}
          subtitle={ruleSubtitle(rule)}
          accessories={[{ text: rule.name }]}
          actions={
            <ActionPanel>
              <Action title="Create Rule" onAction={() => openEditor()} />
              <Action title="Edit Rule" onAction={() => openEditor(rule)} />
              <Action title="Delete Rule" style={Action.Style.Destructive} onAction={() => removeRule(rule)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
