import { render, screen } from '@testing-library/react';
import App from './App';

test('renders a full board in the starting position', () => {
  const { container } = render(<App />);
  expect(container.querySelectorAll('.tile')).toHaveLength(64);
  expect(screen.getAllByRole('img')).toHaveLength(32);
  expect(screen.getByAltText('white king')).toBeInTheDocument();
  expect(screen.getByAltText('black queen')).toBeInTheDocument();
});
