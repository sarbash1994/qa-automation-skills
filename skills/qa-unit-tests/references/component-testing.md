# Component tests with Testing Library

> Snippets show the shape of a good setup, not a copy-paste source of truth. Confirm query names, `user-event` setup and RNTL APIs against the official pages in `official-docs.md` for the installed versions.

## Principle

Test what the user sees and does. Query by role and accessible name first, then label, placeholder and text; `getByTestId` only when nothing accessible exists (and file a testability note). Do not assert on component state, class names or internal props.

## React (web)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw-server';
import { TodoForm } from './TodoForm';

it('submits a trimmed title and clears the input', async () => {
  const user = userEvent.setup();
  server.use(http.post('/api/todos', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ todo: { id: '1', ...body } }, { status: 201 });
  }));
  render(<TodoForm />);

  await user.type(screen.getByRole('textbox', { name: /new note/i }), '  Buy milk  ');
  await user.click(screen.getByRole('button', { name: /add/i }));

  expect(await screen.findByRole('listitem', { name: /buy milk/i })).toBeVisible();
  expect(screen.getByRole('textbox', { name: /new note/i })).toHaveValue('');
});

it('shows the server validation message', async () => {
  server.use(http.post('/api/todos', () => HttpResponse.json({ message: 'Title is required' }, { status: 400 })));
  render(<TodoForm />);
  await userEvent.setup().click(screen.getByRole('button', { name: /add/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
});
```

- `@testing-library/jest-dom` matchers (`toBeVisible`, `toHaveValue`) in the setup file.
- Wrap renders that need providers (router, i18n, query client) in a `renderWithProviders` helper that uses the real providers with test configuration, not mocks of them.
- i18n: use the real message catalogue in tests so assertions use real copy; mock only the locale selection.
- Async UI: `findBy*` and `waitFor`; never `act` wrappers around `userEvent` (it already handles them).
- Hooks: test through a component that uses them, or `renderHook` for pure hooks.

## React Native

```tsx
import { render, screen, userEvent } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';

it('disables submit until both fields are filled', async () => {
  const user = userEvent.setup();
  render(<LoginScreen />);
  const submit = screen.getByRole('button', { name: 'Sign in' });
  expect(submit).toBeDisabled();
  await user.type(screen.getByLabelText('Email'), 'qa@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret-pass');
  expect(submit).toBeEnabled();
});
```

- Preset `jest-expo` (or `react-native`), official jest mocks for `AsyncStorage`, `expo-secure-store`, reanimated; `msw/native` for network.
- Give components `accessibilityRole`/`accessibilityLabel` and `testID`; the same hooks serve Detox/Maestro/Appium later.

## What not to test here

Layout and pixels (visual tests), navigation across many screens (e2e), third-party component internals.

## Pitfalls

- `getBy*` throws when absent: use `queryBy*` for "not rendered" assertions.
- Multiple matches: scope with `within(container)` instead of `getAllBy*()[0]`.
- jsdom gaps (`scrollIntoView`, `matchMedia`, `ResizeObserver`): polyfill in the setup file with a comment, not per test.
- A component that needs five mocks to render is telling you it does too much.
