# ADD Review Criteria Checklist

This document provides detailed review criteria for each stage of a Salsify Architecture Design Document.

## Context Stage

### Problem Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Clarity for outsiders | Error | Problem should be understandable even for reviewers unfamiliar with the area |
| Scope definition | Warning | Problem scope should be clearly bounded |
| No solution bias | Warning | Problem statement should not presuppose a solution |

### Motivation Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Why now | Error | Must explain why this problem needs solving now |
| Business objective | Warning | Should connect to business value or user need |
| Urgency indicators | Suggestion | Timeline or deadline context if applicable |

### Constraints and Assumptions Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Section present | Error | Must have explicit constraints/assumptions section |
| Timeline constraints | Warning | Should note any deadline or timeline expectations |
| Resource constraints | Suggestion | Note team size, budget, or other limitations |
| Technical constraints | Warning | Existing system limitations that affect options |
| Quality expectations | Warning | MVP vs hardened solution expectations |

### Architecturally Significant Requirements Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Requirements listed | Error | Must have explicit requirements that drive decisions |
| Measurable criteria | Warning | Requirements should be verifiable where possible |
| Prioritization | Suggestion | Indicate must-have vs nice-to-have |
| Compatibility check | Warning | Requirements should align with stated constraints |

### Next Steps Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Options listed | Error | Must list options to evaluate (even if one is obvious) |
| Option descriptions | Warning | Each option should have a brief description |
| Input reviewers | Error | Must identify who will provide input on options |
| Agree reviewers | Error | Must identify who will approve the chosen option |
| Reviewer specificity | Warning | Tag individual reviewers, not entire teams |
| Reviewer balance | Suggestion | Keep "Agree" list small to avoid bloated reviews |

### Checkpoint Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Catalog entry | Error | Must be added to ADD catalog with link at top |
| Jira link | Warning | Should link to related Jira ticket |
| Tags set | Warning | Tags should be set in catalog entry |
| Stage status | Error | Stage and status should be set in catalog entry |
| Shared in #eng-docs | Warning | Should be shared for broad visibility |

---

## Options Analysis Stage

### Review Table
| Criteria | Severity | Description |
|----------|----------|-------------|
| Reviewers from Context | Error | Input/Agree reviewers should match Context "Next Steps" |
| Changelog started | Warning | Should have start date in changelog |

### Options Evaluation
| Criteria | Severity | Description |
|----------|----------|-------------|
| All Context options | Error | All options from Context stage should be evaluated |
| Option overviews | Error | Each option needs a brief overview |
| Trade-offs documented | Error | Must document trade-offs for each option |
| Risks identified | Warning | Should identify risks per option |
| Cost estimates | Warning | Should provide relative cost (S/M/L/XL or similar) |
| Backend/Frontend split | Suggestion | Separate estimates by discipline if applicable |

### Decision
| Criteria | Severity | Description |
|----------|----------|-------------|
| Clear decision | Error | Must mark one option as "Chosen" |
| Rationale provided | Error | Must explain why the chosen option was selected |
| Rejected rationale | Warning | Should explain why other options were rejected |
| Constraint alignment | Warning | Decision should align with Context constraints |

### Other Rejected Options
| Criteria | Severity | Description |
|----------|----------|-------------|
| Early rejections listed | Suggestion | Options rejected without full analysis should be noted |
| Rejection reasons | Warning | Brief explanation for each early rejection |

### Next Steps Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Clear next stage | Error | Must indicate if Solution Design is needed |
| Skip justification | Warning | If skipping Solution Design, explain why |
| Input reviewers | Error | Must identify reviewers for next stage |
| Agree reviewers | Error | Must identify approvers for next stage |

### Checkpoint Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Shared for review | Warning | Should share via #eng-docs automation |
| Agree approvals | Error | All "Agree" reviewers should have checked their box |
| Stage status updated | Error | Catalog entry stage status should be current |
| Finalized date | Warning | Changelog should have finalized date |

---

## Solution Design Stage

### Review Table
| Criteria | Severity | Description |
|----------|----------|-------------|
| Reviewers from Options | Error | Input/Agree reviewers should match Options "Next Steps" |
| Changelog started | Warning | Should have start date in changelog |

### Technical Design Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Architecture overview | Error | High-level description of solution architecture |
| New services | Warning | Any new services should be described |
| Service interactions | Warning | Service-to-service communication should be clear |
| API changes | Warning | Major API changes should be highlighted |
| Data structures | Suggestion | Key data structures should be described |
| Diagrams | Suggestion | Complex interactions benefit from diagrams |
| Appropriate detail | Warning | Should be high-level, not implementation minutiae |

### Trade-offs, Risks, and Assumptions Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Section present | Error | Must have explicit trade-offs/risks section |
| Security considerations | Warning | Should address security implications |
| Performance implications | Warning | Should note performance considerations |
| Scalability | Suggestion | Consider scale implications if relevant |
| Operational concerns | Suggestion | Deployment, monitoring, maintenance |

### Alternatives Considered Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Within-solution alternatives | Suggestion | Alternatives within the chosen option |
| No Options Analysis repeat | Warning | Should not repeat Options Analysis content |

### Next Steps Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Clear path forward | Error | Must indicate what happens next |
| ADR needs | Warning | Should note if ADRs are needed for API/schema changes |
| Implementation readiness | Suggestion | Indicate if ready to implement |

### Checkpoint Section
| Criteria | Severity | Description |
|----------|----------|-------------|
| Shared for review | Warning | Should share via #eng-docs automation |
| Agree approvals | Error | All "Agree" reviewers should have checked their box |
| Stage status updated | Error | Catalog entry stage status should be current |
| Finalized date | Warning | Changelog should have finalized date |

---

## Cross-Cutting Concerns (All Stages)

### Catalog Entry
| Criteria | Severity | Description |
|----------|----------|-------------|
| Entry exists | Error | Must have catalog entry |
| Link at document top | Error | Catalog entry should be linked/embedded at top |
| Jira link set | Warning | Catalog entry should link to Jira |
| Stage accurate | Error | Stage field should reflect current stage |
| Status accurate | Error | Status field should reflect current status |
| Review deadline | Suggestion | "Review Stage By" should be set |

### Tags
| Criteria | Severity | Description |
|----------|----------|-------------|
| Tags present | Warning | Should have relevant tags |
| Kebab-case format | Warning | Tags should be `lower-kebab-case` |
| Plural entities | Suggestion | Entity types should be plural (e.g., `target-schemas`) |

### Reviewers
| Criteria | Severity | Description |
|----------|----------|-------------|
| Individual tagging | Warning | Tag specific people, not teams |
| Input vs Agree separation | Warning | Reviewers should be in one list, not both |
| No PM/Design as Agree | Suggestion | Product/Design should use PDRs, not be ADD approvers |
| Core reviewer for Growth | Suggestion | Growth projects should include Core engineer as Agree |

### Comments
| Criteria | Severity | Description |
|----------|----------|-------------|
| Comments addressed | Warning | Open comments should be addressed before stage completion |
| Resolution confirmation | Suggestion | Non-trivial comment resolutions should be confirmed with commenter |

### Document Hygiene
| Criteria | Severity | Description |
|----------|----------|-------------|
| Placeholder text removed | Warning | Template placeholder/instruction text should be removed |
| Consistent formatting | Suggestion | Tables and sections should be consistently formatted |
| Links working | Warning | Internal and external links should be valid |
