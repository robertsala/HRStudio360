import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header Component', () => {
  const mockSetMobileMenuOpen = jest.fn();

  beforeEach(() => {
    mockSetMobileMenuOpen.mockClear();
  });

  test('renders logo and company name', () => {
    render(<Header mobileMenuOpen={false} setMobileMenuOpen={mockSetMobileMenuOpen} />);
    
    const companyName = screen.getByText('HRStudio360');
    expect(companyName).toBeInTheDocument();
  });

  test('renders desktop navigation links', () => {
    render(<Header mobileMenuOpen={false} setMobileMenuOpen={mockSetMobileMenuOpen} />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('Advantages')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  test('toggles mobile menu when hamburger button is clicked', () => {
    render(<Header mobileMenuOpen={false} setMobileMenuOpen={mockSetMobileMenuOpen} />);
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    expect(mockSetMobileMenuOpen).toHaveBeenCalledWith(true);
  });

  test('shows mobile menu when mobileMenuOpen is true', () => {
    render(<Header mobileMenuOpen={true} setMobileMenuOpen={mockSetMobileMenuOpen} />);
    
    // Mobile menu should contain navigation links
    const mobileFeatures = screen.getAllByText('Features');
    expect(mobileFeatures.length).toBeGreaterThan(1); // Desktop + mobile versions
  });
});