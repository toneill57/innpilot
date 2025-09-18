# Anthropic Long Context Management

> **Source**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips

## Key Long Context Strategies

### 1. Document Placement Optimization
- **Critical Rule**: Place long documents (~20K+ tokens) at the TOP of your prompt
- **Order**: Long documents → Instructions → Examples → Query
- **Performance Impact**: Up to 30% improvement in response quality
- **Reason**: Claude processes context more effectively with this structure

### 2. XML Document Structure

#### Recommended Format
```xml
<documents>
  <document index="1">
    <source>document_name.pdf</source>
    <document_content>
      {{DOCUMENT_CONTENT}}
    </document_content>
  </document>
  <document index="2">
    <source>another_document.md</source>
    <document_content>
      {{DOCUMENT_CONTENT}}
    </document_content>
  </document>
</documents>
```

#### XML Best Practices
- Use `<source>` subtags for document identification
- Include `index` attributes for document numbering
- Wrap content in `<document_content>` tags
- Clearly delineate different document sections

### 3. Navigation and Processing Techniques

#### Quote-First Strategy
- Ground responses in quotes before performing tasks
- Ask Claude to extract relevant quotes first
- This helps "cut through the noise" of extensive content

#### Structured Metadata
- Provide clear context and source information
- Use XML subtags for organization
- Include document type, date, or other relevant metadata

### 4. Performance Optimization Rules

#### Prompt Structure
1. **Top**: Long documents and inputs
2. **Middle**: Instructions and context
3. **Bottom**: Queries and examples (optimal placement)

#### Context Management
- Use `/clear` command to reset context window during long sessions
- Leverage subagents for complex problems requiring deep analysis
- Break down complex tasks into smaller, manageable chunks

### 5. Multi-Document Collections

#### Organization Strategy
- Group related documents together
- Use consistent XML structure across documents
- Maintain clear document hierarchy and relationships

#### Reference Strategy
- Enable easy cross-document references
- Support contextual navigation between related sections
- Maintain document source attribution throughout responses

## Implementation Guidelines

### For Single Long Documents
- Place at prompt beginning
- Use clear structure with headings
- Provide context about document purpose

### For Multiple Documents
- Use XML wrapper structure
- Number documents consistently
- Include source metadata for each document

### For Document Collections
- Group by topic or relationship
- Maintain consistent formatting
- Enable cross-reference navigation

## Performance Metrics
- **30% improvement** in response quality when queries placed at end
- **Significant performance gain** with proper document placement
- **Better context comprehension** with XML structure organization