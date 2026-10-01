import { getSelectedText } from "@raycast/api";
import CleaningCommandView from "./components/cleaning-command-view";

export default function Command() {
  return <CleaningCommandView sourceLabel="selected text" readRawText={() => getSelectedText()} />;
}
