import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  // Reset URL hash between tests so each test starts from a known state.
  window.history.replaceState(null, '', window.location.pathname);
});
