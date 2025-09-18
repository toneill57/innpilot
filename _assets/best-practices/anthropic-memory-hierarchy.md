# Anthropic Memory Hierarchy System

> **Source**: https://docs.anthropic.com/en/docs/claude-code/memory

## Memory Hierarchy and Precedence

Claude Code uses a hierarchical memory system with 4 levels, where higher levels take precedence:

### 1. Enterprise Policy (Highest Precedence)
- **Purpose**: System-wide instructions enforced across all users
- **Location**: 
  - macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
  - Linux: `/etc/claude-code/CLAUDE.md`
  - Windows: `C:\ProgramData\ClaudeCode\CLAUDE.md`

### 2. Project Memory
- **Purpose**: Team-shared project instructions
- **Location**: `./CLAUDE.md` (project root)

### 3. User Memory
- **Purpose**: Personal preferences across all projects
- **Location**: `~/.claude/CLAUDE.md`

### 4. Local Memory
- **Purpose**: Directory-specific instructions
- **Location**: `./CLAUDE.local.md`

## Memory Discovery and Loading

### Recursive Discovery
- Claude reads memories recursively from current working directory upwards
- Discovers CLAUDE.md files in parent directories (up to but not including root)
- Subtree CLAUDE.md files loaded only when specific subtrees are accessed

### Import System
- **Syntax**: `@path/to/import`
- **Support**: Both relative and absolute paths
- **Max Depth**: 5 recursive import hops
- **Limitation**: Imports not evaluated within code spans/blocks

### Memory Addition Methods
1. **Quick Add**: Start input with `#` to add to memory
2. **Slash Command**: `/memory` to edit memory files
3. **Bootstrap**: `/init` to create project memory file

## Best Practices for Memory Files

### Structure
- Use structured markdown with clear headings
- Organize with bullet points for clarity
- Be specific in instructions
- Use emphasis ("IMPORTANT", "YOU MUST") for critical rules

### Content Guidelines
- Include bash commands and utility functions
- Document code style guidelines
- Provide testing instructions
- Note unexpected behaviors/warnings
- Setup developer environment instructions
- Repository etiquette rules

### Maintenance
- Keep concise and human-readable
- Iterate and refine based on Claude's performance
- Periodically review and update memories

## Key Features

### Hierarchical Precedence
Files higher in hierarchy provide foundation that specific memories build upon.

### Context Management
- Memory files are loaded at conversation start
- Provide persistent context across interactions
- Can be used to maintain project-specific guidelines

### Import Flexibility
- Modular memory organization
- Shared components across different memory files
- Maximum 5-hop recursive imports for safety