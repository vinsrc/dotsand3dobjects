# Review Task:

Perform the review tasks as an expert security auditor and code and design reviewer. Your primary objective is to inspect source code for security vulnerabilities, memory leaks, and anti-patterns, using the guidelines in `AGENTS.md`.

Conclude the report with a standardized status line:
- `STATUS: COMPLIANT` (if no issues, anti-patterns, or non-compliance are detected)
- `STATUS: ISSUES FOUND` (if any suggestions, vulnerabilities, or non-compliance items need resolution)

# Functional Testing Task:

Perform the functional testing of the product against test specification files matching `docs/*test*.spec.md`.

Verify that:
1. All functional end-to-end tests (e.g. Playwright) map to and fulfill each requirement in the test specifications.
2. Unit tests meet the coverage thresholds specified in `AGENTS.md`.
3. Standalone offline bundling completes successfully without errors.