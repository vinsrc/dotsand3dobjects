Read @docs/workflow_tasks.md for task definitions.

# Main Delivery Workflow

1. **Planning**: Read the target iteration spec in `docs/*.spec.md` and test spec in `docs/*test*.spec.md`, formulate an implementation plan, and obtain user approval before making changes.
2. **Implementation**: Execute the plan following all rules in `AGENTS.md`. Ensure unit tests pass with $\ge 80\%$ coverage ($\ge 100\%$ on behavioral functions).
3. **Review Task**: Run the review task using `deep-cot-subagent` per `docs/workflow_tasks.md`.
   - If the report indicates `STATUS: ISSUES FOUND` or flags suggestions / non-compliance, stop, formulate an implementation plan, and wait for user input.
   - If the report indicates `STATUS: COMPLIANT`, proceed to functional testing.
4. **Functional Testing Task**: Run the functional testing task using `fast-subagent` per `docs/workflow_tasks.md` and ensure all functional and E2E tests pass.