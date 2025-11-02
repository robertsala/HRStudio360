import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders HRStudio360 heading', () => {
    render(<App />);
    const heading = screen.getByText(/HRStudio360/i);
    expect(heading).toBeInTheDocument();
  });

  test('renders hero section with main title', () => {
    render(<App />);
    const heroTitle = screen.getByText(/The AI-powered platform/i);
    expect(heroTitle).toBeInTheDocument();
  });

  test('renders navigation menu', () => {
    render(<App />);
    const featuresLink = screen.getByText('Features');
    const solutionsLink = screen.getByText('Solutions');
    const advantagesLink = screen.getByText('Advantages');
    const contactLink = screen.getByText('Contact');
    
    expect(featuresLink).toBeInTheDocument();
    expect(solutionsLink).toBeInTheDocument();
    expect(advantagesLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });

  test('renders request demo buttons', () => {
    render(<App />);
    const demoButtons = screen.getAllByText(/Request Demo/i);
    expect(demoButtons.length).toBeGreaterThan(0);
  });
});