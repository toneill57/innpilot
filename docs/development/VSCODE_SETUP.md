# VSCode Setup & Sync Configuration

## Buffer Conflict Resolution

**Problem Solved**: Buffer conflicts when Claude Code modifies files externally.

### Automatic Configuration

The project includes `.vscode/settings.json` with optimized settings for Claude Code integration:

```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "git.autorefresh": true,
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true
  }
}
```

### What This Solves

- ✅ **Auto-save**: Files save automatically every second
- ✅ **Auto-refresh**: VSCode detects external file changes immediately
- ✅ **No "Save or Don't Save" dialogs**: Changes appear instantly
- ✅ **Git integration**: Auto-refresh on repository changes

### Manual Setup (if needed)

If `.vscode/settings.json` doesn't exist:

1. Create `.vscode/settings.json` in project root
2. Copy the configuration above
3. Reload VSCode window (`Cmd/Ctrl + Shift + P` → "Reload Window")

### Conflict Detection Script

The project includes `scripts/check-file-conflicts.js` to detect buffer conflicts:

```bash
node scripts/check-file-conflicts.js
```

This checks for:
- Dirty buffers (unsaved changes)
- Files modified externally
- Potential conflicts between VSCode and Claude Code

### Best Practices

1. **Keep VSCode open** while Claude Code works
2. **Trust the auto-save** - no need to manually save
3. **If conflicts occur** - close and reopen the file
4. **Monitor file watcher** - ensure it's not excluded in settings

### Troubleshooting

**Files not refreshing?**
- Check if auto-save is enabled: Check bottom status bar
- Reload window: `Cmd/Ctrl + Shift + P` → "Reload Window"
- Verify `.vscode/settings.json` exists and is valid JSON

**Still seeing "Save or Don't Save"?**
- Ensure `files.autoSave` is set to `"afterDelay"`
- Check VSCode version (update if older than 1.70)
- Disable conflicting extensions (e.g., custom save extensions)

### Complete Workflow Documentation

For the complete Claude Code + VSCode workflow, see:
- [CLAUDE.md](../../CLAUDE.md) - Main project instructions
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guidelines
- [SNAPSHOT.md](../../SNAPSHOT.md) - Full technical reference

---

**Last Updated:** October 1, 2025
