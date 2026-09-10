# Iteration Delivery Workflow

An Issue may be a bug or a new feature.

1. **Issue Selection**: Select an issue from iteration backlog assigned to user vinsrc from github.  if there are no more issues in the backlog that are assigned to user vinsrc , then go to step 10.

2. **Planning**: Read the selected issue from github. Move this issue to the 'In Progress' column on the project board.  Plan issue resolution. Issue may be a bug or feature. Plan accordingly. and ask the user for confirmation to proceed to implementation. if plan is approved, generate a new issue plan file @docs/wip/<issue_number>.plan.md

3. **Implementation**: Execute the plan following all rules in `AGENTS.md`. Ensure unit tests pass with $\ge 80\%$ coverage ($\ge 100\%$ on behavioral functions).

4. **Review Task**: This task is disabled. Do not run. 
<!-- Run the review task using `deep-cot-subagent` per `docs/workflows/tasks/review-task.md`.
   - If the report indicates `STATUS: ISSUES FOUND` or flags suggestions / non-compliance, stop, formulate an implementation plan, and wait for user input.
   - If the report indicates `STATUS: COMPLIANT`, proceed to functional testing. -->

5. **Spec Freeze**: Once the review passes, Ask the user to check functionality. if the user has more changes, update the iteration spec with changes. if the functionality has achieved desired state, then spec is finalized, Check if the iteration spec matches the implementation and proceed to write Functional test cases based on the spec into in @docs/wip/<issue_number>.tests.spec.md

6. **Functional Testing Task**: Run the functional testing task using `fast-subagent` per `docs/workflows/tasks/func-testing-task.md` and ensure all functional and E2E tests pass.

7. Attach @docs/wip/<issue_number>.tests.spec.md and @docs/wip/<issue_number>.plan.md to the issue in github and delete the local wip files.

8. Move the issue to Done.

9. Go to step 1.

10. Iteration Complete.