import { Action, ActionPanel, Form } from "@raycast/api";
import { useMemo, useState } from "react";
import { dedupeParamKeys, formatDetectedParams, getPreviewUrl } from "./unknown-url-rule-form-helpers";

interface UnknownUrlRuleFormProps {
  url: string;
  host: string;
  path: string;
  availableParams: string[];
  onSave: (allowParams: string[]) => Promise<void>;
  onSkip: () => Promise<void>;
}

export default function UnknownUrlRuleForm(props: UnknownUrlRuleFormProps) {
  const [selectedParams, setSelectedParams] = useState<string[]>(() => dedupeParamKeys(props.availableParams));
  const paramKeys = useMemo(() => dedupeParamKeys(props.availableParams), [props.availableParams]);
  const previewUrl = useMemo(() => getPreviewUrl(props.url, selectedParams), [props.url, selectedParams]);
  const detectedParamsText = useMemo(() => formatDetectedParams(props.availableParams), [props.availableParams]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Rule and Reclean" onSubmit={() => props.onSave(selectedParams)} />
          <Action.OpenInBrowser title="Open Preview URL in Browser" url={previewUrl} />
          <Action title="Skip and Keep Partial Result" onAction={props.onSkip} />
        </ActionPanel>
      }
    >
      <Form.Description title="No Available Rule" text={`Create a rule for ${props.host}${props.path}`} />
      <Form.Description title="Original URL" text={props.url} />
      <Form.Description title="Detected Parameters" text={detectedParamsText} />
      <Form.TagPicker id="allowParams" title="Keep Parameters" value={selectedParams} onChange={setSelectedParams}>
        {paramKeys.map((key) => (
          <Form.TagPicker.Item key={key} value={key} title={key} />
        ))}
      </Form.TagPicker>
      <Form.Description title="Preview" text={previewUrl} />
    </Form>
  );
}
