export type Group = "mine" | "system";

export interface Job {
  label: string;
  path: string;
  group: Group;
  schedule: string;
  program: string;
  outPath: string | null;
  errPath: string | null;
  loaded: boolean;
  disabled: boolean;
  pid: number | null;
  lastExit: number | null;
  parseError: string | null;
}

export interface CalendarEntry {
  minute: number | null;
  hour: number | null;
  day: number | null;
  weekday: number | null;
  month: number | null;
}

export interface JobForm {
  label: string;
  programArguments: string[];
  runAtLoad: boolean;
  startInterval: number | null;
  calendar: CalendarEntry[];
  watchPaths: string[];
  keepAlive: boolean;
  standardOutPath: string | null;
  standardErrorPath: string | null;
  workingDirectory: string | null;
  environmentVariables: [string, string][];
}

export interface JobDetail {
  job: Job;
  form: JobForm;
  rawPlist: string;
}

export interface LiveStatus {
  loaded: boolean;
  disabled: boolean;
  pid: number | null;
  lastExit: number | null;
}

export type Action = "load" | "unload" | "enable" | "disable" | "restart";

export const emptyForm = (): JobForm => ({
  label: "",
  programArguments: [],
  runAtLoad: false,
  startInterval: null,
  calendar: [],
  watchPaths: [],
  keepAlive: false,
  standardOutPath: null,
  standardErrorPath: null,
  workingDirectory: null,
  environmentVariables: [],
});
