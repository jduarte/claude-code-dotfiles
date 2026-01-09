# Stage-Specific Review Guidelines

This document provides guidance on how to review each stage of an ADD appropriately, including what to focus on and what to avoid at each stage.

## General Review Philosophy

The ADD process is designed to be **iterative and flexible**. As a reviewer:

1. **Support ideation** - Help authors explore options, don't shut down ideas prematurely
2. **Guide, don't dictate** - Provide direction without being prescriptive
3. **Respect the stage** - Don't demand future-stage detail at earlier stages
4. **Keep reviews efficient** - Focus on what matters at each stage

## Reviewer Roles

### Input Reviewers
- Provide advice, suggestions, and concerns
- Don't need to approve the stage
- Can drop themselves from future stages if no longer needed
- Should check their box when they've provided the input they want to provide

### Agree Reviewers
- Responsible for approving decisions made in the stage
- Should check their box AND add the date when approving
- Keep this group small to avoid bloated reviews
- Acts like GitHub approval - author knows they can proceed when all boxes are checked

## Context Stage Review

### What to Focus On
- Is the **problem clear** to someone unfamiliar with the area?
- Is the **motivation** compelling - why solve this now?
- Are **constraints and assumptions** documented?
- Is the **options list** comprehensive enough to proceed?
- Are the right **reviewers identified** for the next stage?

### What to Avoid
- Demanding detailed solution analysis
- Forcing the author to pick an option
- Asking for implementation details
- Requiring exhaustive technical specifications

### Key Questions to Ask
- "Have you considered option X?"
- "Is there a timeline constraint we should know about?"
- "Who else should be involved in reviewing options?"
- "Are there risks or considerations we're missing?"

### When Context is Ready
- Problem is understandable
- Motivation is clear
- Constraints are documented
- Options list exists (even if brief)
- Reviewers for next stage are identified

---

## Options Analysis Stage Review

### What to Focus On
- Are **all options from Context** being evaluated?
- Are **trade-offs clearly documented** for each option?
- Is there a **clear decision** with rationale?
- Does the decision **align with constraints** from Context?
- Are **rejected options explained**?

### What to Avoid
- Demanding implementation-level detail
- Re-litigating constraints from Context stage
- Requiring every minor decision to be documented
- Forcing unnecessary options analysis when one option is obvious

### Key Questions to Ask
- "How does this align with the constraint about X?"
- "What's the main risk with the chosen option?"
- "Why was Option Y rejected over Option Z?"
- "Is there enough detail to move to Solution Design?"

### When Options Analysis is Ready
- All relevant options evaluated
- Trade-offs documented
- Clear decision made with rationale
- Agree reviewers have approved

### Skipping Options Analysis
It's acceptable to skip Options Analysis when:
- There's only one viable option given constraints
- The solution is well-established (existing patterns/tech)
- Reviewers agree during Context stage

If skipping, this should be:
- Called out in Context "Next Steps"
- Agreed upon by Context reviewers

---

## Solution Design Stage Review

### What to Focus On
- Is the **technical design at appropriate detail**?
- Are **trade-offs, risks, and assumptions** documented?
- Are **service interactions** clear?
- Is it clear **what happens next** (ADRs? Implementation?)

### What to Avoid
- Demanding implementation minutiae
- Requiring every edge case to be addressed
- Re-evaluating the option decision from previous stage
- Expecting ADR-level detail (that's what ADRs are for)

### Key Questions to Ask
- "How does this handle failure scenario X?"
- "What's the migration path from current state?"
- "Are there operational concerns we should address?"
- "Do we need ADRs for any API/schema changes?"

### When Solution Design is Ready
- Technical approach is clear
- Major risks are identified and mitigated
- Next steps are defined
- Agree reviewers have approved

### Skipping Solution Design
It's acceptable to skip Solution Design when:
- The chosen option uses well-established patterns
- Implementation is straightforward from Options Analysis
- Reviewers agree during Options Analysis stage

If skipping, this should be:
- Called out in Options Analysis "Next Steps"
- Agreed upon by Options Analysis reviewers

---

## Cross-Cutting Review Concerns

### Catalog Hygiene
At every stage, verify:
- Catalog entry exists and is linked at document top
- Stage and status fields are current
- Tags are set appropriately
- Jira link is present

### Comment Management
- Comments should only be resolved when fully addressed
- For non-trivial comments, confirm resolution with commenter
- Unresolved comments block stage completion

### Reviewer Evolution
As the document progresses:
- Reviewer list should naturally narrow
- Not everyone from Context needs to review Solution Design
- Experts in rejected options may drop off
- New domain experts may join for specific stages

---

## When to Push Back on Stage Progression

### Red Flags for Context Stage
- Problem statement is incomprehensible to outsiders
- No options are listed
- No reviewers identified for next stage
- Constraints are missing that would significantly affect options

### Red Flags for Options Analysis
- Options from Context are missing without explanation
- No trade-off analysis
- Decision made without rationale
- Decision contradicts stated constraints

### Red Flags for Solution Design
- No technical design provided
- Risks completely unaddressed
- No path forward defined
- Agree reviewers haven't approved

---

## ADR Relationship

After Solution Design, ADRs may or may not be needed:

### ADRs ARE Needed For
- All public API changes
- Non-trivial service interface changes (GraphQL, Avro, Config Manifests)
- Non-trivial library interface changes
- Introduction of new technologies

### ADRs Generally NOT Needed For
- Decisions already captured in the ADD
- Implementation plans
- Options analysis (use ADD instead)

### ADR Guidelines
- Keep ADRs concise (~300 lines or less)
- ADRs should record decisions, not make them
- Consensus should be established in ADD before ADR
- ADRs coming from ADDs should be focused and non-controversial
