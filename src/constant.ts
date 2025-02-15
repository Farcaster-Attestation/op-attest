export const HUB_ID = "op_attest";
export const DEFAULT_BYTES_VALUE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const EAS_QUEUE_NAME = "eas-attest";
export const BACKFILL_QUEUE_NAME = "backfill";
export const RECONCILE_JOB_NAME = "reconcile";
export const COMPLETION_MARKER_JOB_NAME = "completionMarker";
export const SUBMIT_PROOF_QUEUE_NAME = "submit-proof";
export const CHALLENGE_BLOCK_OFFSET = 433500; // 43200 blocks = 1 day plus 150 blocks for safety
export const CHALLENGE_QUEUE_NAME = "challenge";

export enum MessageStatus {
    Created = 0,
    HandlingSubmit = 1,
    Submitted = 2,
    HandlingAttest = 3,
    Attested = 4,
    FailedSubmit = 5,
    FailedAttest = 6,
}