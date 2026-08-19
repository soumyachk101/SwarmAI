/**
 * @swarm/reports/core — Pure report engine.
 *
 * Zero Node.js runtime dependencies. Testable without mocks.
 */

export { createReportEngine } from "./engine.js";

export { BUILTIN_TEMPLATES } from "./templates.js";

export type {
 Report,
 ReportBody,
 ReportSection,
 ReportApproval,
 ReportStatus,
 ApprovalStatus,
 ReportTemplateId,
 ReportAggregation,
 AgentSessionInput,
 BoardCardInput,
 GitCommitInput,
 ReportBuildOptions,
 TemplateSection,
} from "./types.js";

export {
 newReportId,
 newSectionId,
 newApprovalId,
} from "./types.js";
