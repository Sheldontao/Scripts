import { Action, ActionPanel, Form } from "@raycast/api";
import { useState } from "react";
import { formatAllowParams, parseAllowParams } from "./rule-editor-form-helpers";

interface RuleEditorValues {
  name: string;
  host: string;
  path: string;
  allowParams: string[];
}

interface RuleEditorFormProps {
  initialValues?: RuleEditorValues;
  onSave: (values: RuleEditorValues) => Promise<void>;
}

export default function RuleEditorForm(props: RuleEditorFormProps) {
  const [name, setName] = useState(props.initialValues?.name ?? "Custom Rule");
  const [host, setHost] = useState(props.initialValues?.host ?? "");
  const [path, setPath] = useState(props.initialValues?.path ?? "/");
  const [allowParams, setAllowParams] = useState(formatAllowParams(props.initialValues?.allowParams ?? []));

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Rule"
            onSubmit={() =>
              props.onSave({
                name,
                host,
                path,
                allowParams: parseAllowParams(allowParams),
              })
            }
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Rule Name" value={name} onChange={setName} />
      <Form.TextField id="host" title="Host" placeholder="h5.m.goofish.com" value={host} onChange={setHost} />
      <Form.TextField id="path" title="Path" placeholder="/item" value={path} onChange={setPath} />
      <Form.TextArea
        id="allowParams"
        title="Allowed Query Params"
        placeholder="id, itemId"
        value={allowParams}
        onChange={setAllowParams}
      />
    </Form>
  );
}

export type { RuleEditorValues };
