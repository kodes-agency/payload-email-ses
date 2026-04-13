```markdown
# payload-email-ses Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill covers the development patterns and conventions used in the `payload-email-ses` TypeScript repository. It documents file organization, code style, commit conventions, and testing practices. By following these guidelines, contributors can maintain consistency and quality across the codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `emailSender.ts`, `sesClient.test.ts`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import { sendEmail } from './emailSender';
    ```

### Export Style
- Use **named exports** for functions, classes, and constants.
  - Example:
    ```typescript
    export function sendEmail() { ... }
    export const SES_REGION = 'us-east-1';
    ```

### Commit Messages
- Follow the **Conventional Commits** specification.
- Prefixes: `feat` (for new features), `fix` (for bug fixes).
- Keep commit messages concise (average ~61 characters).
  - Example:
    ```
    feat: add support for custom email headers
    fix: correct SES region configuration
    ```

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new capability or enhancement  
**Command:** `/add-feature`

1. Create a new TypeScript file using camelCase naming.
2. Implement the feature using named exports.
3. Add or update tests in a corresponding `.test.ts` file.
4. Use a `feat:` prefix in the commit message.
5. Use relative imports for any internal dependencies.

### Fixing a Bug
**Trigger:** When resolving a defect or issue  
**Command:** `/fix-bug`

1. Identify the problematic code section.
2. Apply the fix, maintaining code style conventions.
3. Update or add tests to cover the fix.
4. Use a `fix:` prefix in the commit message.

### Writing Tests
**Trigger:** When adding or updating tests  
**Command:** `/write-test`

1. Create or update a test file with the `.test.ts` suffix.
2. Write tests for the relevant functions or modules.
3. Follow the same import/export conventions as production code.

## Testing Patterns

- Test files use the `*.test.ts` naming pattern.
- The specific testing framework is not detected, but tests should be written in TypeScript.
- Place tests alongside or near the modules they cover.
- Example test file:
  ```typescript
  import { sendEmail } from './emailSender';

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      // Test implementation
    });
  });
  ```

## Commands
| Command       | Purpose                                  |
|---------------|------------------------------------------|
| /add-feature  | Start the workflow for adding a feature  |
| /fix-bug      | Start the workflow for fixing a bug      |
| /write-test   | Start the workflow for writing tests     |
```
