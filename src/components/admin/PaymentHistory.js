import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminLayout from './components/AdminLayout';
import Spinner from '../common/Spinner';

const Container = styled.div`
  padding: 20px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.dark};
`;

const FiltersContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  display: block;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const TableContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: ${({ theme }) => theme.colors.light};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.secondary};
`;

const TableCell = styled.td`
  padding: 12px 16px;
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
    status === 'succeeded' ? theme.colors.success :
    status === 'refunded' ? theme.colors.warning :
    theme.colors.danger
  };
  
  color: ${({ theme }) => theme.colors.white};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.light};
`;

const PageInfo = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const PageControls = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  background-color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.light};
  color: ${({ theme, active }) => active ? theme.colors.white : theme.colors.dark};
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function PaymentHistory() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    startDate: '',
    endDate: ''
  });
  
  const { api } = useAPI();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await api.getPaymentHistory(params);
      setPayments(response.data.payments);
      setPagination(response.data.pagination);
    } catch (error) {
      showAlert('Error loading payment history', 'danger');
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <Container>
        <PageHeader>
          <PageTitle>Payment History</PageTitle>
        </PageHeader>

        <FiltersContainer>
          <FilterGroup>
            <FilterLabel>Status</FilterLabel>
            <Select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="succeeded">Succeeded</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </Select>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>Plan</FilterLabel>
            <Select name="plan" value={filters.plan} onChange={handleFilterChange}>
              <option value="">All Plans</option>
              <option value="1-hour">1 Hour</option>
              <option value="3-hour">3 Hours</option>
              <option value="1-day">1 Day</option>
              <option value="3-day">3 Days</option>
              <option value="7-day">7 Days</option>
            </Select>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>From Date</FilterLabel>
            <Input 
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleFilterChange} 
            />
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>To Date</FilterLabel>
            <Input 
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleFilterChange} 
            />
          </FilterGroup>
        </FiltersContainer>

        <TableContainer>
          {loading ? (
            <Spinner message="Loading payment history..." />
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Payment ID</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Customer</TableHeader>
                    <TableHeader>Plan</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <tbody>
                  {payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>{formatDate(payment.timestamp)}</TableCell>
                      <TableCell>{payment.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{payment.plan?.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan="6" style={{ textAlign: 'center' }}>
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </Table>
              
              <Pagination>
                <PageInfo>
                  Showing {payments.length} of {pagination.total} payments
                </PageInfo>
                <PageControls>
                  <PageButton 
                    disabled={pagination.page === 1} 
                    onClick={() => handlePageChange(1)}
                  >
                    First
                  </PageButton>
                  <PageButton 
                    disabled={pagination.page === 1} 
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </PageButton>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.min(
                      Math.max(1, pagination.page - 2) + i,
                      pagination.pages
                    );
                    
                    if (pageNum <= pagination.pages) {
                      return (
                        <PageButton 
                          key={pageNum}
                          active={pageNum === pagination.page}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </PageButton>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PageButton 
                    disabled={pagination.page === pagination.pages} 
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </PageButton>
                  <PageButton 
                    disabled={pagination.page === pagination.pages} 
                    onClick={() => handlePageChange(pagination.pages)}
                  >
                    Last
                  </PageButton>
                </PageControls>
              </Pagination>
            </>
          )}
        </TableContainer>
      </Container>
    </AdminLayout>
  );
}

export default PaymentHistory;