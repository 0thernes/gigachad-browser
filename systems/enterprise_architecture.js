'use strict';

/**
 * GIGACHAD AI BROWSER — Unified Enterprise Systems Architecture Barrel
 * Aggregates:
 *  1. 12-Entity Entity-Relationship Diagram & Schema Validator (ERD)
 *  2. 12-Risk Enterprise Risk Management Register & Posture Evaluator (ERM)
 *  3. Enterprise Resource Planning & Hardware Quota Planner (ERP)
 *  4. 500-Point Grade-A Browser Standard Operating Procedure (SOP-500)
 *  5. 100-Pass Full-Stack Verification Engine (BE:30 / FE:30 / FS:40)
 */

const erd = require('./erd-schema');
const erm = require('./erm-risk-engine');
const erp = require('./erp-resource-planner');
const sop = require('./sop-500-checklist');
const pass100 = require('./pass-100-verifier');

module.exports = {
  ...erd,
  ...erm,
  ...erp,
  ...sop,
  ...pass100
};
