import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GuardLogList from '../GuardLogList';
import { AuthProvider } from '../../contexts/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock data
const mockGuardLogs = [
  {
    id: 1,
    station: { name: 'Station 1' },
    shift: { name: 'Shift 1' },
    log_date: '2024-04-07',
    guardLogPasses: [
      {
        id: 1,
        personnel: { name: 'Guard 1' },
        pas: { name: 'Pass 1' },
        is_present: true
      }
    ]
  }
];

const mockStations = [
  { id: 1, name: 'Station 1' }
];

const mockShifts = [
  { id: 1, name: 'Shift 1' }
];

const mockPersonnel = [
  { id: 1, name: 'Guard 1' }
];

const mockPasses = [
  { id: 1, name: 'Pass 1' }
];

describe('GuardLogList Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      switch (url) {
        case 'http://localhost:8000/api/guard-logs':
          return Promise.resolve({ data: mockGuardLogs });
        case 'http://localhost:8000/api/stations':
          return Promise.resolve({ data: mockStations });
        case 'http://localhost:8000/api/shifts':
          return Promise.resolve({ data: mockShifts });
        case 'http://localhost:8000/api/guard-logs/personnel':
          return Promise.resolve({ data: mockPersonnel });
        case 'http://localhost:8000/api/passes':
          return Promise.resolve({ data: mockPasses });
        default:
          return Promise.reject(new Error('not found'));
      }
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <GuardLogList />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders guard logs list', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('لوح نگهبانی')).toBeInTheDocument();
    });
  });

  test('can filter guard logs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText('ایستگاه')).toBeInTheDocument();
      expect(screen.getByLabelText('شیفت')).toBeInTheDocument();
    });

    const stationSelect = screen.getByLabelText('ایستگاه');
    fireEvent.change(stationSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('station_id=1')
      );
    });
  });

  test('can create new guard log', async () => {
    axios.post.mockResolvedValueOnce({ data: { message: 'لوح نگهبانی با موفقیت ثبت شد' } });
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ثبت لوح جدید')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ثبت لوح جدید'));

    await waitFor(() => {
      expect(screen.getByText('ثبت لوح نگهبانی')).toBeInTheDocument();
    });

    // Fill form
    const stationSelect = screen.getByLabelText('ایستگاه');
    const shiftSelect = screen.getByLabelText('شیفت');
    const dateInput = screen.getByLabelText('تاریخ');

    fireEvent.change(stationSelect, { target: { value: '1' } });
    fireEvent.change(shiftSelect, { target: { value: '1' } });
    fireEvent.change(dateInput, { target: { value: '2024-04-07' } });

    fireEvent.click(screen.getByText('ثبت'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/guard-logs',
        expect.any(Object)
      );
    });
  });

  test('shows error message on failed API call', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('خطا در دریافت اطلاعات')).toBeInTheDocument();
    });
  });

  test('can handle empty guard logs list', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('هیچ لوح نگهبانی یافت نشد')).toBeInTheDocument();
    });
  });
}); 