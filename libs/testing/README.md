# @ibid/testing

Test engines shared across the workspace's apps. Only code that **knows nothing about any
product's domain** belongs here — accessibility auditing, screenshots, flow recording.

Anything domain-dependent (seeds, fixtures, helpers for concrete pages) stays in that app's own
`e2e/` folder.

## Contents

| Module         | What it does                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `A11yAuditor`  | Injects axe-core into a page and fails the test on critical or serious WCAG 2.1 AA violations, plus text under 12px. |
| `FlowRecorder` | Captures a flow step by step, with readable filenames and full-page screenshots.                                     |
| `screenshot`   | Screenshot paths per device (mobile/tablet/desktop), derived from `TestInfo`.                                        |

## Application selectors

`FlowRecorder` and `scrollContentToTop` need to know which container scrolls and which element
is the loading curtain. Both take those selectors as parameters, defaulting to what the ibid
apps use (`.app-sidenav-content` and `.o-loading-curtain--visible`).
