
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Tutorials from './Tutorials';
import { BrowserRouter } from 'react-router-dom';

describe('Tutorials Page', () => {
  it('renders video tutorials heading', () => {
    render(
      <BrowserRouter>
        <Tutorials />
      </BrowserRouter>
    );
    expect(screen.getByText(/Video Tutorials/i)).toBeTruthy();
  });

  // Integration test: It should display videos extracted from articles
  // Since we know there are videos in the articles (e.g. Case Binding Overview)
  it('displays video cards', () => {
    render(
      <BrowserRouter>
        <Tutorials />
      </BrowserRouter>
    );
    // There should be play buttons or headings
    // Let's check for a known video title if possible, or just the structure
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBeGreaterThan(0);
  });
});
