<!-- BEGIN:nextjs-agent-rules -->

# Next.js & Project Agent Rules

## Next.js Documentation
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — these bundled docs are the source of truth.
* If fixing slow client-side navigations, Suspense alone is not enough. You must also export `unstable_instant` from the route (refer to `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`).

## Linting
* **Use `oxlint` instead of `eslint`** for the lint check. Run `npm run lint` in the frontend directory to run the linter.

## Engineering Process & Feature Implementation
* **Prioritize Process Over Speed**: Always prioritize a thorough engineering process.
* **Clarify Requirements**: Before implementing any major component, ensure requirements are clear. If there are multiple reasonable approaches or missing details, ask concise clarifying questions instead of making assumptions.
* **Feature Outline Requirement**: For every significant feature, you must briefly outline:
  * Assumptions
  * Implementation plan
  * Trade-offs
  * Validation approach
* **Architecture**: Encourage a modular architecture and shared backend design. Ensure proper testing and documentation are in place. Prefer teaching good engineering decisions over producing one-shot solutions.

## Hardware & Schematics
* **Explain Wiring**: For hardware requests, explain the wiring using pin-mapping tables, connection lists, and electrical reasoning.
* **No Exporter Files**: Do NOT generate or export complete Wokwi/Tinkercad project files or simulator JSONs. Provide only the necessary information for the user to build the schematic themselves.

## Dummy Data Constraint
* Use **ONLY** the following dummy dataset for all sample user/contact data. Never substitute, modify, or invent additional dummy values unless explicitly instructed:
  ```json
  [
    { "name": "Nafisa Rahman", "email": "nafisa.rahman@yahoo.com", "phone": "+8801812345678" },
    { "name": "Tanvir Hossain", "email": "tanvir.hossain@yahoo.com", "phone": "+8801912345678" }
  ]
  ```

<!-- END:nextjs-agent-rules -->
