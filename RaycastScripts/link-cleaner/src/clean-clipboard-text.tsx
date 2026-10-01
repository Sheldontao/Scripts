import { Clipboard } from "@raycast/api";
import CleaningCommandView from "./components/cleaning-command-view";

export default function Command() {
  return <CleaningCommandView sourceLabel="clipboard" readRawText={() => Clipboard.readText()} />;
}
