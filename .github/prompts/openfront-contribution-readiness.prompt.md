---
name: "OpenFront Contribution Readiness"
description: "Use when preparing an OpenFront contribution plan and PR-ready checklist before coding"
argument-hint: "Feature/fix idea and impacted areas"
agent: "agent"
---

Create a contribution-readiness plan for OpenFrontIO using the user input as scope.

Input:

- Contribution idea (feature or bug fix)
- Impacted files or areas (if known)

Goals:

- Ensure the contributor follows project contribution expectations before significant implementation.
- Produce a concrete, PR-ready checklist with testing expectations.

Requirements to enforce:

1. Before starting substantial work:

- Open an issue describing the contribution.
- Wait for maintainer feedback before investing significant time.
- Exception: small improvements can proceed directly to PR.

2. Code quality requirements:

- Keep code well-commented and aligned with existing style patterns.
- Do not break existing functionality.
- Thoroughly test code before submission.
- Any change in src/core MUST include tests.

3. Pull request process:

- Keep the PR focused on one feature or one bug fix.
- Include screenshots for UI changes.
- Describe testing performed.
- Be responsive to review feedback and requested changes.

4. Testing requirements:

- Verify changes behave as expected.
- Test across multiple systems/browsers when applicable.
- Document the testing process in the PR.

Output format:

- Short summary of the contribution scope.
- "Before Coding" checklist.
- "Implementation Guardrails" checklist.
- "Testing Plan" checklist.
- "PR Submission Checklist" checklist.
- Risks/unknowns and what to clarify with maintainers.

If user input is ambiguous, ask up to 3 concise clarification questions before finalizing the plan.
