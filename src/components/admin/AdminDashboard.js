import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminLayout from './components/AdminLayout';
import Spinner from '../common/Spinner';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const DashboardContainer = styled.div`
  padding: 20px;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
`;

const StatTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 8px;
  text-transform: uppercase;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 4px;
`;

const StatChange = styled.div`
  font-size: 12px;
  color: ${({ positive }) => positive ? '#28a745' : '#dc3545'};
  display: flex;
  align-items: center;
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 2fr 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 16px;
`;

const RecentActivitySection = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.dark};
`;

const Button = styled.button`
  background-color: ${({ theme, secondary }) => secondary ? theme.colors.light : theme.colors.primary};
  color: ${({ theme, secondary }) => secondary ? theme.colors.dark : theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};
  pointer-events: ${({ disabled }) => disabled ? 'none' : 'auto'};
  
  &:hover {
    background-color: ${({ theme, secondary }) => secondary ? '#e2e6ea' : '#0069d9'};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  border-bottom: 2px solid ${({ theme }) => theme.colors.light};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.secondary};
`;

const TableCell = styled.td`
  padding: 12px 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  background-color: ${({ theme, status }) => 
    status === 'active' ? theme.colors.success :
    status === 'expired' ? theme.colors.secondary :
    status === 'revoked' ? theme.colors.danger :
    theme.colors.warning
  };
  
  color: ${({ theme }) => theme.colors.white};
`;

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [initializing, setInitializing] = useState(false);
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();

  const initializeSampleData = async () => {
    setInitializing(true);
    try {
      const response = await api.initializeSampleData();
      showAlert(response.message || 'Sample data initialized successfully', 'success');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      showAlert('Error initializing sample data: ' + error.message, 'danger');
    } finally {
      setInitializing(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await api.getAdminDashboardStats();
      setStats(statsResponse.data);
      
      // These API methods may not exist in the current implementation
      // So we're wrapping them in try-catch blocks
      try {
        const vouchersResponse = await api.getAllVouchers({ limit: 5, sort: '-createdAt' });
        setRecentVouchers(vouchersResponse.data || []);
      } catch (err) {
        console.log('Vouchers data not available yet');
      }
      
      try {
        const paymentsResponse = await api.getAllPayments({ limit: 5, sort: '-createdAt' });
        setRecentPayments(paymentsResponse.data || []);
      } catch (err) {
        console.log('Payments data not available yet');
      }
    } catch (error) {
      showAlert('Error loading dashboard data', 'danger');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [api, showAlert]);

  const navigateToVouchers = () => {
    history.push('/admin/vouchers');
  };

  const navigateToPayments = () => {
    history.push('/admin/payments');
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <Spinner message="Loading dashboard data..." />
      </AdminLayout>
    );
  }

  // Prepare chart data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Revenue',
        data: stats?.revenueData?.map(d => d.amount / 100) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4
      }
    ]
  };

  const usageData = {
    labels: ['1-hour', '3-hour', '1-day', '3-day', '7-day'],
    datasets: [
      {
        label: 'Plan Usage',
        data: stats?.planUsage?.map(p => p.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <AdminLayout>
      <DashboardContainer>
        <ActionBar>
          <Button 
            onClick={initializeSampleData} 
            disabled={initializing}
            secondary={!initializing}
          >
            {initializing ? 'Initializing...' : 'Initialize Sample Data'}
          </Button>
        </ActionBar>
        
        <StatsGrid>
          <StatCard>
            <StatTitle>Active Guests</StatTitle>
            <StatValue>{stats?.guests?.active || 0}</StatValue>
            <StatChange positive={true}>
              ↑ {stats?.guests?.activeChange || 0}% from yesterday
            </StatChange>
          </StatCard>
          
          <StatCard>
            <StatTitle>Active Vouchers</StatTitle>
            <StatValue>{stats?.vouchers?.active || 0}</StatValue>
            <StatChange positive={stats?.vouchers?.activeChange >= 0}>
              {stats?.vouchers?.activeChange >= 0 ? '↑' : '↓'} {Math.abs(stats?.vouchers?.activeChange || 0)}% from last week
            </StatChange>
          </StatCard>
          
          <StatCard>
            <StatTitle>Today's Revenue</StatTitle>
            <StatValue>{formatCurrency(stats?.revenue?.today || 0)}</StatValue>
            <StatChange positive={stats?.revenue?.todayChange >= 0}>
              {stats?.revenue?.todayChange >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenue?.todayChange || 0)}% from yesterday
            </StatChange>
          </StatCard>
          
          <StatCard>
            <StatTitle>Monthly Revenue</StatTitle>
            <StatValue>{formatCurrency(stats?.revenue?.monthly || 0)}</StatValue>
            <StatChange positive={stats?.revenue?.monthlyChange >= 0}>
              {stats?.revenue?.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenue?.monthlyChange || 0)}% from last month
            </StatChange>
          </StatCard>
        </StatsGrid>
        
        <ChartsContainer>
          <ChartCard>
            <ChartTitle>Revenue Trend</ChartTitle>
            <Line 
              data={revenueData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `$${context.raw.toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value;
                      }
                    }
                  }
                }
              }}
            />
          </ChartCard>
          
          <ChartCard>
            <ChartTitle>Plan Usage Distribution</ChartTitle>
            <Bar 
              data={usageData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </ChartCard>
        </ChartsContainer>
        
        <RecentActivitySection>
          <SectionHeader>
            <SectionTitle>Recent Vouchers</SectionTitle>
            <Button onClick={navigateToVouchers}>View All</Button>
          </SectionHeader>
          
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Code</TableHeader>
                <TableHeader>Created At</TableHeader>
                <TableHeader>Duration</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {recentVouchers.map(voucher => (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.code}</TableCell>
                  <TableCell>{formatDate(voucher.createdAt)}</TableCell>
                  <TableCell>{voucher.durationMinutes / 60} hours</TableCell>
                  <TableCell>
                    <StatusBadge status={voucher.status}>
                      {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
              {recentVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" style={{ textAlign: 'center' }}>No vouchers found</TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </RecentActivitySection>
        
        <RecentActivitySection>
          <SectionHeader>
            <SectionTitle>Recent Payments</SectionTitle>
            <Button onClick={navigateToPayments}>View All</Button>
          </SectionHeader>
          
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Plan</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {recentPayments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id.substring(0, 8)}...</TableCell>
                  <TableCell>{formatDate(payment.timestamp)}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.plan?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status === 'succeeded' ? 'active' : 'revoked'}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan="5" style={{ textAlign: 'center' }}>No payments found</TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </RecentActivitySection>
      </DashboardContainer>
    </AdminLayout>
  );
}

export default AdminDashboard;
