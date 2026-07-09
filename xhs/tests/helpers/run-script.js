import { readFileSync } from "node:fs";
import vm from "node:vm";

const SCRIPT_PATH = new URL("../../xhs_fmz200.js", import.meta.url);
const SCRIPT_SOURCE = readFileSync(SCRIPT_PATH, "utf8");
class DoneSignal extends Error {
  constructor() { super("DONE"); this.name = "DoneSignal"; }
}

export function runScript({
  url,
  argument = {},
  responseBody,
  requestBody = "",
  initialStore = {},
  contextExtensions = {},
}) {
  const store = new Map(Object.entries(initialStore));
  const logs = [];
  const errors = [];
  let donePayload = undefined;

  const context = {
    console: {
      log: (...args) => logs.push(args.map(String).join(" ")),
      error: (...args) => errors.push(args.map(String).join(" ")),
    },
    $request: {
      url,
      body: requestBody,
    },
    $httpClient: {},
    $loon: undefined,
    $response:
      responseBody === undefined
        ? undefined
        : {
            body: responseBody,
          },
    $argument: argument,
    $persistentStore: {
      read(key) {
        return store.has(key) ? store.get(key) : null;
      },
      write(value, key) {
        store.set(key, value);
        return true;
      },
    },
    ...contextExtensions,
    $done(payload = {}) {
      donePayload = payload;
      throw new DoneSignal();
    },
  };

  vm.createContext(context);
  try {
    vm.runInContext(SCRIPT_SOURCE, context, { filename: "xhs_fmz200.js" });
  } catch (error) {
    if (!(error instanceof DoneSignal)) {
      throw error;
    }
  }

  return {
    donePayload,
    logs,
    errors,
    store: Object.fromEntries(store),
  };
}
