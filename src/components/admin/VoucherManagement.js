import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminLayout from './components/AdminLayout';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';

const VoucherContainer = styled.div`
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background-color: ${({ theme, secondary, danger }) => 
    danger ? theme.colors.danger : 
    secondary ? theme.colors.light : 
    theme.colors.primary
  };
  color: ${({ theme, secondary }) => secondary ? theme.colors.dark : theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme, secondary, danger }) => 
      danger ? '#c82333' : 
      secondary ? '#e2e6ea' : 
      '#0069d9'
    };
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

const Checkbox = styled.input`
  cursor: pointer;
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
    status === 'used' ? theme.colors.warning :
    theme.colors.info
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

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
`;

const VoucherCodeBox = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  padding: 8px;
  margin-top: 4px;
  font-family: monospace;
  font-size: 16px;
  letter-spacing: 1px;
  text-align: center;
`;

const PrintButton = styled.button`
  background-color: ${({ theme }) => theme.colors.info};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #138496;
  }
`;

function VoucherManagement() {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    duration: '',
    createdAfter: '',
    createdBefore: ''
  });
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    count: 5,
    durationMinutes: 60,
    usageQuota: 1,
    note: '',
    dataLimitMB: 0,
    uploadSpeedKbps: 0,
    downloadSpeedKbps: 0
  });
  const [newVouchers, setNewVouchers] = useState([]);
  
  const { api } = useAPI();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchVouchers();
  }, [pagination.page, filters]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await api.getVouchers(params);
      setVouchers(response.data.vouchers);
      setPagination(response.data.pagination);
    } catch (error) {
      showAlert('Error loading vouchers', 'danger');
      console.error('Error fetching vouchers:', error);
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

  const handleSelectAll = () => {
    if (allSelected) {
        setSelectedVouchers([]);
      } else {
        setSelectedVouchers(vouchers.map(v => v.id));
      }
      setAllSelected(!allSelected);
    };
  
    const handleSelectVoucher = (id) => {
      if (selectedVouchers.includes(id)) {
        setSelectedVouchers(prev => prev.filter(v => v !== id));
      } else {
        setSelectedVouchers(prev => [...prev, id]);
      }
    };
  
    const handleCreateChange = (e) => {
      const { name, value } = e.target;
      setCreateFormData(prev => ({
        ...prev,
        [name]: name === 'count' || name === 'durationMinutes' || 
                 name === 'usageQuota' || name === 'dataLimitMB' || 
                 name === 'uploadSpeedKbps' || name === 'downloadSpeedKbps' 
          ? parseInt(value, 10) 
          : value
      }));
    };
  
    const handleCreateVouchers = async () => {
      try {
        const response = await api.createVouchers(createFormData);
        
        if (response.success) {
          setNewVouchers(response.data.vouchers);
          showAlert(`Created ${response.data.vouchers.length} vouchers successfully`, 'success');
          fetchVouchers();
        } else {
          throw new Error(response.message || 'Failed to create vouchers');
        }
      } catch (error) {
        showAlert('Error creating vouchers: ' + error.message, 'danger');
        console.error('Error creating vouchers:', error);
      }
    };
  
    const handleDeleteVouchers = async () => {
      try {
        if (selectedVouchers.length === 1) {
          await api.revokeVoucher(selectedVouchers[0]);
        } else {
          await api.batchRevokeVouchers(selectedVouchers);
        }
        
        showAlert(`Deleted ${selectedVouchers.length} vouchers successfully`, 'success');
        setSelectedVouchers([]);
        setAllSelected(false);
        setShowDeleteModal(false);
        fetchVouchers();
      } catch (error) {
        showAlert('Error deleting vouchers: ' + error.message, 'danger');
        console.error('Error deleting vouchers:', error);
      }
    };
  
    const handlePrintVoucher = (voucher) => {
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Voucher ${voucher.code}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .voucher {
                border: 1px solid #ccc;
                border-radius: 8px;
                padding: 20px;
                max-width: 300px;
                margin: 0 auto;
              }
              .logo {
                text-align: center;
                margin-bottom: 20px;
                font-size: 24px;
                font-weight: bold;
              }
              .code {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                letter-spacing: 2px;
                margin: 15px 0;
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 4px;
              }
              .details {
                margin-top: 15px;
                font-size: 14px;
              }
              .details div {
                margin-bottom: 5px;
              }
              .note {
                margin-top: 15px;
                font-style: italic;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="voucher">
              <div class="logo">WiFi Voucher</div>
              <div class="code">${voucher.code}</div>
              <div class="details">
                <div><strong>Duration:</strong> ${voucher.durationMinutes / 60} hours</div>
                <div><strong>Usage Limit:</strong> ${voucher.usageQuota === 0 ? 'Unlimited' : voucher.usageQuota} device(s)</div>
                ${voucher.dataLimitMB ? `<div><strong>Data Limit:</strong> ${voucher.dataLimitMB >= 1024 ? `${(voucher.dataLimitMB / 1024).toFixed(1)} GB` : `${voucher.dataLimitMB} MB`}</div>` : ''}
                <div><strong>Created:</strong> ${new Date(voucher.createdAt).toLocaleDateString()}</div>
              </div>
              ${voucher.note ? `<div class="note">Note: ${voucher.note}</div>` : ''}
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    };
  
    const formatDuration = (minutes) => {
      if (minutes < 60) {
        return `${minutes} minutes`;
      }
      
      const hours = minutes / 60;
      if (hours % 1 === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      
      return `${hours.toFixed(1)} hours`;
    };
  
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString();
    };
  
    return (
      <AdminLayout>
        <VoucherContainer>
          <PageHeader>
            <PageTitle>Voucher Management</PageTitle>
            <ButtonGroup>
              <Button onClick={() => setShowCreateModal(true)}>Create Vouchers</Button>
              <Button 
                secondary 
                disabled={selectedVouchers.length === 0}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Selected ({selectedVouchers.length})
              </Button>
            </ButtonGroup>
          </PageHeader>
  
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Status</FilterLabel>
              <Select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </Select>
            </FilterGroup>
            
            <FilterGroup>
              <FilterLabel>Duration</FilterLabel>
              <Select name="duration" value={filters.duration} onChange={handleFilterChange}>
                <option value="">All Durations</option>
                <option value="60">1 Hour</option>
                <option value="180">3 Hours</option>
                <option value="360">6 Hours</option>
                <option value="720">12 Hours</option>
                <option value="1440">1 Day</option>
                <option value="4320">3 Days</option>
                <option value="10080">1 Week</option>
              </Select>
            </FilterGroup>
            
            <FilterGroup>
              <FilterLabel>Created After</FilterLabel>
              <Input 
                type="date" 
                name="createdAfter" 
                value={filters.createdAfter} 
                onChange={handleFilterChange} 
              />
            </FilterGroup>
            
            <FilterGroup>
              <FilterLabel>Created Before</FilterLabel>
              <Input 
                type="date" 
                name="createdBefore" 
                value={filters.createdBefore} 
                onChange={handleFilterChange} 
              />
            </FilterGroup>
          </FiltersContainer>
  
          <TableContainer>
            {loading ? (
              <Spinner message="Loading vouchers..." />
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>
                        <Checkbox 
                          type="checkbox" 
                          checked={allSelected} 
                          onChange={handleSelectAll} 
                        />
                      </TableHeader>
                      <TableHeader>Code</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader>Duration</TableHeader>
                      <TableHeader>Usage</TableHeader>
                      <TableHeader>Data Limit</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {vouchers.map(voucher => (
                      <TableRow key={voucher.id}>
                        <TableCell>
                          <Checkbox 
                            type="checkbox" 
                            checked={selectedVouchers.includes(voucher.id)} 
                            onChange={() => handleSelectVoucher(voucher.id)} 
                          />
                        </TableCell>
                        <TableCell>{voucher.code}</TableCell>
                        <TableCell>{formatDate(voucher.createdAt)}</TableCell>
                        <TableCell>{formatDuration(voucher.durationMinutes)}</TableCell>
                        <TableCell>
                          {voucher.usageQuota === 0 
                            ? 'Unlimited' 
                            : `${voucher.usageCount || 0}/${voucher.usageQuota}`
                          }
                        </TableCell>
                        <TableCell>
                          {voucher.dataLimitMB 
                            ? voucher.dataLimitMB >= 1024 
                              ? `${(voucher.dataLimitMB / 1024).toFixed(1)} GB` 
                              : `${voucher.dataLimitMB} MB`
                            : 'None'
                          }
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={voucher.status}>
                            {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <PrintButton onClick={() => handlePrintVoucher(voucher)}>
                            Print
                          </PrintButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {vouchers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan="8" style={{ textAlign: 'center' }}>
                          No vouchers found
                        </TableCell>
                      </TableRow>
                    )}
                  </tbody>
                </Table>
                
                <Pagination>
                  <PageInfo>
                    Showing {vouchers.length} of {pagination.total} vouchers
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
          
          {/* Create Vouchers Modal */}
          <Modal
            isOpen={showCreateModal}
            title="Create Vouchers"
            onClose={() => {
              setShowCreateModal(false);
              setNewVouchers([]);
            }}
          >
            {newVouchers.length > 0 ? (
              <>
                <h3>Vouchers Created Successfully</h3>
                <p>The following vouchers have been created:</p>
                
                {newVouchers.map(voucher => (
                  <div key={voucher.id} style={{ marginBottom: '16px' }}>
                    <strong>Code:</strong>
                    <VoucherCodeBox>{voucher.code}</VoucherCodeBox>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <PrintButton onClick={() => handlePrintVoucher(voucher)}>
                        Print
                      </PrintButton>
                    </div>
                  </div>
                ))}
                
                <ModalActions>
                  <Button onClick={() => {
                    setShowCreateModal(false);
                    setNewVouchers([]);
                  }}>
                    Close
                  </Button>
                </ModalActions>
              </>
            ) : (
              <>
                <FormGroup>
                  <FilterLabel>Number of vouchers</FilterLabel>
                  <Input 
                    type="number" 
                    name="count" 
                    value={createFormData.count} 
                    onChange={handleCreateChange} 
                    min={1}
                    max={100}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FilterLabel>Duration (minutes)</FilterLabel>
                  <Select name="durationMinutes" value={createFormData.durationMinutes} onChange={handleCreateChange}>
                    <option value={60}>1 Hour</option>
                    <option value={180}>3 Hours</option>
                    <option value={360}>6 Hours</option>
                    <option value={720}>12 Hours</option>
                    <option value={1440}>1 Day</option>
                    <option value={4320}>3 Days</option>
                    <option value={10080}>1 Week</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <FilterLabel>Usage quota</FilterLabel>
                  <Select name="usageQuota" value={createFormData.usageQuota} onChange={handleCreateChange}>
                    <option value={1}>Single-use</option>
                    <option value={0}>Unlimited</option>
                    <option value={2}>2 devices</option>
                    <option value={3}>3 devices</option>
                    <option value={5}>5 devices</option>
                    <option value={10}>10 devices</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <FilterLabel>Data limit (MB, 0 for unlimited)</FilterLabel>
                  <Input 
                    type="number" 
                    name="dataLimitMB" 
                    value={createFormData.dataLimitMB} 
                    onChange={handleCreateChange} 
                    min={0}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FilterLabel>Download speed (Kbps, 0 for unlimited)</FilterLabel>
                  <Input 
                    type="number" 
                    name="downloadSpeedKbps" 
                    value={createFormData.downloadSpeedKbps} 
                    onChange={handleCreateChange} 
                    min={0}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FilterLabel>Upload speed (Kbps, 0 for unlimited)</FilterLabel>
                  <Input 
                    type="number" 
                    name="uploadSpeedKbps" 
                    value={createFormData.uploadSpeedKbps} 
                    onChange={handleCreateChange} 
                    min={0}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FilterLabel>Note (optional)</FilterLabel>
                  <Input 
                    type="text" 
                    name="note" 
                    value={createFormData.note} 
                    onChange={handleCreateChange} 
                    placeholder="e.g., 'Conference Room 1'"
                  />
                </FormGroup>
                
                <ModalActions>
                  <Button secondary onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVouchers}>
                    Create
                  </Button>
                </ModalActions>
              </>
            )}
          </Modal>
          
          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            title="Delete Vouchers"
            onClose={() => setShowDeleteModal(false)}
          >
            <p>Are you sure you want to delete {selectedVouchers.length} voucher(s)?</p>
            <p>This action cannot be undone.</p>
            
            <ModalActions>
              <Button secondary onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button danger onClick={handleDeleteVouchers}>
                Delete
              </Button>
            </ModalActions>
          </Modal>
        </VoucherContainer>
      </AdminLayout>
    );
  }
  
  export default VoucherManagement;