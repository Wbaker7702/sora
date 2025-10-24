#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateCommandDocs() {
  log('📚 Generating command documentation...', 'blue');

  // Read commands from the commands file
  const commandsPath = path.join(__dirname, '../renderer/lib/commands.ts');
  const commandsContent = fs.readFileSync(commandsPath, 'utf8');

  // Extract command definitions using regex
  const commandRegex = /export\s+const\s+(\w+)\s*=\s*{\s*name:\s*['"`]([^'"`]+)['"`],\s*description:\s*['"`]([^'"`]+)['"`],\s*usage:\s*['"`]([^'"`]+)['"`],\s*examples:\s*\[([^\]]+)\]/g;
  
  const commands = [];
  let match;
  
  while ((match = commandRegex.exec(commandsContent)) !== null) {
    const [, name, commandName, description, usage, examples] = match;
    
    // Parse examples
    const exampleMatches = examples.match(/['"`]([^'"`]+)['"`]/g);
    const parsedExamples = exampleMatches ? exampleMatches.map(ex => ex.replace(/['"`]/g, '')) : [];
    
    commands.push({
      name: commandName,
      description,
      usage,
      examples: parsedExamples,
      functionName: name
    });
  }

  // Generate markdown documentation
  const docsDir = path.join(__dirname, '../docs/docs/commands');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Generate individual command files
  commands.forEach(command => {
    const commandDoc = `---
title: ${command.name}
sidebar_label: ${command.name}
---

# ${command.name}

${command.description}

## Usage

\`\`\`bash
${command.usage}
\`\`\`

## Examples

${command.examples.map(example => `\`\`\`bash
${example}
\`\`\``).join('\n\n')}

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (See usage above) | - | - | - |

## Notes

- This command is part of the Sora CLI interface
- Make sure Soroban CLI is installed before using this command
- Check the [troubleshooting guide](../troubleshooting/common-issues.md) if you encounter issues

## Related Commands

- [All Commands](./index.md)
- [Command Builder](../features/command-builder.md)
- [Soroban CLI Documentation](https://soroban.stellar.org/docs)
`;

    const fileName = `${command.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    const filePath = path.join(docsDir, fileName);
    fs.writeFileSync(filePath, commandDoc);
    log(`✅ Generated ${fileName}`, 'green');
  });

  // Generate index file
  const indexDoc = `---
title: Command Reference
sidebar_label: Commands
---

# Command Reference

This section contains documentation for all available Sora commands.

## Available Commands

${commands.map(command => `- [${command.name}](./${command.name.toLowerCase().replace(/\s+/g, '-')}.md) - ${command.description}`).join('\n')}

## Quick Start

1. Open Sora application
2. Navigate to the Commands tab
3. Select a command from the list
4. Fill in the required parameters
5. Click "Execute" to run the command

## Command Builder

The Command Builder provides an intuitive interface for constructing Soroban CLI commands:

1. Select the command type
2. Choose options and flags
3. Preview the generated command
4. Execute or copy the command

## Examples

### Creating a New Project

\`\`\`bash
soroban contract new my-project
\`\`\`

### Building a Contract

\`\`\`bash
soroban contract build
\`\`\`

### Deploying a Contract

\`\`\`bash
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/my_contract.wasm
\`\`\`

## Troubleshooting

If you encounter issues with commands:

1. Check the [troubleshooting guide](../troubleshooting/common-issues.md)
2. Verify Soroban CLI is installed: \`soroban --version\`
3. Check command syntax and parameters
4. Review error messages for specific issues

## Related Documentation

- [Getting Started](../getting-started/quick-start.md)
- [Project Management](../features/project-management.md)
- [Network Management](../features/network-management.md)
- [Identity Management](../features/identity-management.md)
`;

  const indexPath = path.join(docsDir, 'index.md');
  fs.writeFileSync(indexPath, indexDoc);
  log('✅ Generated command index', 'green');

  log(`📚 Generated documentation for ${commands.length} commands`, 'green');
}

// Run the script
if (require.main === module) {
  generateCommandDocs();
}

module.exports = { generateCommandDocs };