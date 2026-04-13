export { sesAdapter } from "./sesAdapter";
export type {
  SESAdapterArgs,
  SESEmailResponse,
  SESEmailAdapter,
  Logger,
} from "./types";
export {
  buildFromAddress,
  resolveFromAddress,
  mapDestination,
  mapEmailContent,
} from "./helpers";
