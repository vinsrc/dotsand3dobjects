# Main Delivery Workflow

1. **Planning**: Read the target iteration spec in `docs/*.spec.md` , formulate an implementation plan, and obtain user approval before making changes.
2. **Implementation**: Execute the plan following all rules in `AGENTS.md`. Ensure unit tests pass with $\ge 80\%$ coverage ($\ge 100\%$ on behavioral functions).
<!-- 4. **Review Task**: This task is disabled. Do not run. 
<!-- Run the review task using `deep-cot-subagent` per `docs/workflows/tasks/review-task.md`.
   - If the report indicates `STATUS: ISSUES FOUND` or flags suggestions / non-compliance, stop, formulate an implementation plan, and wait for user input.
   - If the report indicates `STATUS: COMPLIANT`, proceed to functional testing. 

4. **Spec Freeze**: Once the review passes, Ask the user to check functionality. if the user has more changes, update the iteration spec with changes. if the functionality has achieved desired state, then spec is finalized, Check if the iteration spec matches the implementation and proceed to write Functional test cases based on the spec into in `docs/<iteration_name>.tests.spec.md`
5. **Functional Testing Task**: This task is disabled. Do not run. 
<!-- Run the functional testing task using `fast-subagent` per `docs/workflows/tasks/func-testing-task.md` and ensure all functional and E2E tests pass. -->