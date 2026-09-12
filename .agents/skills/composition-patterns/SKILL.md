---
name: composition-patterns
description: Advanced React component composition patterns, compound components, polymorphic controls, slot pattern, and eliminating prop drilling.
---

# 🧱 React Component Composition Patterns

Design scalable, decoupled, and highly reusable React UI architectures using proven composition patterns.

## 📐 Key Patterns

1. **Compound Components**:
   - Build complex widgets (dialogs, tabs, accordions, dropdowns) from cooperating subcomponents sharing implicit state via React Context:
     ```tsx
     <Tabs defaultValue="overview">
       <Tabs.List>
         <Tabs.Trigger value="overview">Resumen</Tabs.Trigger>
         <Tabs.Trigger value="roster">Plantilla</Tabs.Trigger>
       </Tabs.List>
       <Tabs.Content value="overview">...</Tabs.Content>
       <Tabs.Content value="roster">...</Tabs.Content>
     </Tabs>
     ```

2. **Slot / Children Pattern**:
   - Avoid boolean prop flags (`hasHeader`, `showFooter`, `isCardWithBadge`).
   - Use JSX slots (`header={<Header />}`) or `children` composition so consumers control layout and styling directly.

3. **Inversion of Control (IoC)**:
   - Instead of writing monolithic components with 30 configurable props, allow callers to inject custom renders or wrap primitives.
   - Example: Custom Avatar rendering inside a MatchCard without modifying MatchCard's core logic.

4. **Polymorphic Components (`asChild` / `as`)**:
   - Allow a component to render as a button, link (`Link`), or custom HTML tag while preserving unified button styling and keyboard behaviors.

5. **Headless State Extraction**:
   - Separate state and keyboard navigation logic into custom hooks (`useTabs`, `useDropdown`) and keep rendering purely visual.
