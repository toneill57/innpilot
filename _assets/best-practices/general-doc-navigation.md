# General Documentation Navigation Best Practices

> **Sources**: I'd Rather Be Writing, O'Reilly "Designing Web Navigation", Multiple UX resources

## Core Design Principles

### 1. Hierarchy
- Create clear parent-child relationships
- Limit sidebar depth to 1-2 levels for usability
- Maximum recommended depth: 3-4 levels
- Avoid hierarchies deeper than 5 levels (creates cognitive overhead)

### 2. Progressive Disclosure
Layer information across different levels:
- **Doc portal homepage**: Overview and entry points
- **Product homepage**: Feature summaries
- **Section homepage**: Topic collections
- **Individual page**: Detailed content

### 3. Immersion and Context
- Provide context about documentation scope
- Allow users to understand system complexity at a glance
- Show the "whole" of your documentation structure

## Navigation Types and Patterns

### Structural Navigation
- **Main Navigation**: Primary site structure
- **Local Navigation**: Section-specific navigation
- **Breadcrumbs**: Path context and wayfinding

### Associative Navigation
- **Contextual Navigation**: Related content links
- **Adaptive Navigation**: User-behavior driven
- **Quick Links**: Frequently accessed content
- **Footer Navigation**: Secondary access points

### Utility Navigation
- **Extra-site Navigation**: External resources
- **Toolboxes**: Functional utilities
- **Linked Logo**: Return to home navigation
- **Language Selectors**: Internationalization

## Content Organization Strategies

### Hub-and-Spoke Pattern
- Central navigation hub connects to specific content
- Unidirectional linking reduces cognitive load
- Clear entry and exit points for each topic

### Leaf Structure Implementation
- Terminal nodes (leaves) contain complete information
- Parent nodes provide navigation and context
- Clean parent-child relationships without circular references

### Content Consolidation
- Create comprehensive topics (800-3,000 words)
- Use on-page table of contents for longer content
- Combine related concepts into "articles"
- Reduce fragmentation across multiple short pages

## Wayfinding Techniques

### Context Preservation
- Provide context links throughout content
- Include workflow maps for complex processes
- Add "Next Steps" sections to guide progression
- Implement consistent breadcrumb navigation

### Popular Content Surfacing
- Analyze metrics to identify most-viewed topics
- Feature popular content prominently
- Make top topics easily accessible from homepage
- Create quick access to frequently referenced material

### Inline Navigation
- Include contextual links within content
- Link to related concepts and procedures
- Follow "bottom-up navigation" principles
- Link to descriptions when mentioning tools/concepts

## Best Practices Summary

### Navigation Visibility
- Make navigation intuitive and "invisible"
- Follow standard patterns users expect
- Provide multiple pathways to important content
- Ensure consistent navigation across all pages

### Information Architecture
- Group related content logically
- Use descriptive, predictable naming conventions
- Implement clear visual hierarchy
- Maintain consistent structure patterns

### User Experience
- "Think like a visitor, not a designer"
- Help users predict where links will lead
- Support reorientation on new pages
- Reduce cognitive load through clear organization

### Content Strategy
- Show basics first, then advanced features
- Layer complexity appropriately
- Provide multiple entry points for different user types
- Enable discovery of related content

## Implementation Guidelines

### Hierarchy Recommendations
- **Optimal**: 2-3 levels for most content
- **Acceptable**: Up to 4 levels for complex domains
- **Maximum**: 5 levels (only when absolutely necessary)
- **Avoid**: Deeper than 5 levels (creates navigation confusion)

### Link Strategy
- Prefer contextual over generic linking
- Use descriptive link text
- Avoid "click here" or "read more"
- Provide preview context for external links

### Structure Principles
- Everything should be "as simple as possible, but no simpler"
- Present navigational options as cohesive units
- Consider how visitors perceive different navigation mechanisms
- Balance completeness with usability