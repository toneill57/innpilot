# Anthropic Navigation and Structure Patterns

> **Sources**: Multiple Anthropic documentation pages

## Claude Code Best Practices for Structure

### Project Organization

#### CLAUDE.md File Strategy
- **Location**: Repo root, parent/child directories, or home folder
- **Purpose**: Provide persistent context and guidelines
- **Content Include**:
  - Bash commands and core utility functions
  - Code style guidelines and testing instructions
  - Repository etiquette and developer environment setup
  - Unexpected behaviors and warnings

#### Context Optimization
- Keep CLAUDE.md files concise and human-readable
- Iterate and refine based on Claude's performance
- Use emphasis ("IMPORTANT", "YOU MUST") for critical adherence
- Use `#` key for quick documentation additions

### Memory Hierarchy Implementation

#### Recursive Reading Pattern
- Claude reads memories recursively from current directory upward
- Discovers CLAUDE.md files in parent directories
- Subtree files loaded only when specific subtrees accessed
- Maximum import depth of 5 hops for safety

#### Import System Usage
```markdown
@path/to/shared/guidelines.md
@../common/setup-instructions.md
@~/templates/code-standards.md
```

### Context Management Strategies

#### Session Management
- Use `/clear` to reset context window during long sessions
- Leverage subagents for complex, multi-part problems
- Use "think" variations to allocate more computational budget

#### Workflow Patterns
1. **Explore**: Understand the problem space
2. **Plan**: Create structured approach
3. **Code**: Implement with context awareness
4. **Commit**: Document changes and decisions

### Configuration Hierarchy

#### Precedence Order (Highest to Lowest)
1. Enterprise Policy (`/Library/Application Support/ClaudeCode/CLAUDE.md`)
2. Project Memory (`./CLAUDE.md`)
3. User Memory (`~/.claude/CLAUDE.md`)
4. Local Memory (`./CLAUDE.local.md`)

#### File Discovery
- Enterprise security policies always enforced
- Team customizations in project files
- Individual preferences in user files
- Directory-specific overrides in local files

### Advanced Features

#### MCP Integration
- Configure `.mcp.json` for shared tool configurations
- Use MCP servers for extended functionality
- Integrate with external systems and APIs

#### Custom Commands
- Use `.claude/commands` for project-specific slash commands
- Create reusable command patterns
- Implement workflow automation

### Best Practices Summary

#### Structure Guidelines
- Maintain clear hierarchy with logical precedence
- Use imports for modular, reusable content
- Keep documentation close to relevant code
- Implement progressive disclosure of complexity

#### Context Optimization
- Place long content at beginning of prompts
- Use XML structure for document collections
- Ground responses in quotes before analysis
- Leverage recursive memory discovery patterns

#### Workflow Integration
- Combine visual iteration with context management
- Use headless mode for automation tasks
- Employ multiple Claude instances for verification
- Implement test-driven development approaches