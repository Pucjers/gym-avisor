  
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import { BrowserRouter } from 'react-router-dom';
  import GymMap from '../../components/gyms/GymMap';
  import { collection, getDocs, query } from 'firebase/firestore';
  import { useAuth } from '../../contexts/AuthContext';
  
  // Mock dependencies
  jest.mock('firebase/firestore');
  jest.mock('../../contexts/AuthContext');
  jest.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children }) => <div data-testid="map-marker">{children}</div>,
    Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
    useMap: () => ({ setView: jest.fn() }),
    Circle: () => <div data-testid="map-circle" />,
  }));
  
  // Mock L from leaflet
  jest.mock('leaflet', () => ({
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: {}
        },
        mergeOptions: jest.fn()
      }
    },
    icon: jest.fn().mockReturnValue({}),
    Icon: jest.fn().mockImplementation(() => ({}))
  }));
  
  describe('GymMap Component', () => {
    const mockGyms = [
      {
        id: 'gym1',
        name: 'Fitness Club',
        type: 'gym',
        address: '123 Main St, City',
        location: { lat: 49.8397, lng: 24.0297 },
        rating: '4.5',
        reviewsCount: 10
      },
      {
        id: 'gym2',
        name: 'Yoga Studio',
        type: 'yoga',
        address: '456 Oak St, City',
        location: { lat: 49.8450, lng: 24.0350 },
        rating: '4.8',
        reviewsCount: 15
      }
    ];
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock Firestore
      collection.mockReturnValue('gymsCollection');
      query.mockReturnValue('gymsQuery');
      getDocs.mockResolvedValue({
        docs: mockGyms.map(gym => ({
          id: gym.id,
          data: () => gym
        }))
      });
      
      // Mock auth context
      useAuth.mockReturnValue({
        currentUser: null
      });
    });
    
    test('should render map and gym list', async () => {
      render(
        <BrowserRouter>
          <GymMap />
        </BrowserRouter>
      );
      
      // Initially should show loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Map container should be rendered
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      
      // Gym listings should be rendered
      expect(screen.getByText('Fitness Club')).toBeInTheDocument();
      expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
      
      // Search and filter controls should be rendered
      expect(screen.getByLabelText(/пошук спортзалу/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/тип спортзалу/i)).toBeInTheDocument();
      
      // Location controls should be rendered
      expect(screen.getByRole('button', { name: /визначити місцезнаходження/i })).toBeInTheDocument();
      expect(screen.getByText(/радіус пошуку/i)).toBeInTheDocument();
    });
    
    test('should filter gyms by type', async () => {
      render(
        <BrowserRouter>
          <GymMap />
        </BrowserRouter>
      );
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Both gyms should be visible initially
      expect(screen.getByText('Fitness Club')).toBeInTheDocument();
      expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
      
      // Open the filter dropdown
      fireEvent.mouseDown(screen.getByLabelText(/тип спортзалу/i));
      
      // Select Yoga option
      const yogaOption = screen.getByRole('option', { name: /йога/i });
      fireEvent.click(yogaOption);
      
      // Only Yoga Studio should be visible now
      expect(screen.queryByText('Fitness Club')).not.toBeInTheDocument();
      expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
    });
    
    test('should search gyms by name', async () => {
      render(
        <BrowserRouter>
          <GymMap />
        </BrowserRouter>
      );
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Both gyms should be visible initially
      expect(screen.getByText('Fitness Club')).toBeInTheDocument();
      expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
      
      // Search for "Yoga"
      fireEvent.change(screen.getByLabelText(/пошук спортзалу/i), {
        target: { value: 'Yoga' }
      });
      
      // Only Yoga Studio should be visible now
      expect(screen.queryByText('Fitness Club')).not.toBeInTheDocument();
      expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
    });
    
    test('should show gym details in drawer when selected', async () => {
      render(
        <BrowserRouter>
          <GymMap />
        </BrowserRouter>
      );
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Click on a gym card
      fireEvent.click(screen.getByText('Fitness Club'));
      
      // Drawer should open with gym details
      expect(screen.getAllByText('Fitness Club')).toHaveLength(2); // One in card, one in drawer
      expect(screen.getByText('123 Main St, City')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /прокласти маршрут/i })).toBeInTheDocument();
      
      // Close drawer
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      
      // Drawer should close
      expect(screen.getAllByText('Fitness Club')).toHaveLength(1); // Only in card
    });
  });