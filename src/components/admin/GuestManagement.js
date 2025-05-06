import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminLayout from './components/AdminLayout';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';

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

const TableContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
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
    status === 'active' ? theme.colors.success :
    status === 'expired' ? theme.colors.secondary :
    theme.colors.warning
  };
  
  color: ${({ theme }) => theme.colors.white};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
`;

function GuestManagement() {
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  
  const { api } = useAPI();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const response = await api.getActiveGuests();
      setGuests(response.data);
    } catch (error) {
      showAlert('Error loading guests', 'danger');
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectGuest(selectedGuest.id);
      showAlert('Guest disconnected successfully', 'success');
      setShowDisconnectModal(false);
      fetchGuests();
    } catch (error) {
      showAlert('Error disconnecting guest: ' + error.message, 'danger');
      console.error('Error disconnecting guest:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return 'Expired';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    
    return `${minutes}m`;
  };

  const formatDataUsage = (used, total) => {
    if (used < 1024 && total < 1024) {
      return `${used.toFixed(1)}/${total.toFixed(1)} MB`;
    }
    
    const usedGB = used / 1024;
    const totalGB = total / 1024;
    
    return `${usedGB.toFixed(1)}/${totalGB.toFixed(1)} GB`;
  };

  return (
    <AdminLayout>
      <Container>
        <PageHeader>
          <PageTitle>Guest Management</PageTitle>
          <Button onClick={fetchGuests}>Refresh</Button>
        </PageHeader>

        <TableContainer>
          {loading ? (
            <Spinner message="Loading guest data..." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>MAC Address</TableHeader>
                  <TableHeader>IP Address</TableHeader>
                  <TableHeader>Connected Since</TableHeader>
                  <TableHeader>Expires</TableHeader>
                  <TableHeader>Remaining</TableHeader>
                  <TableHeader>Data Usage</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {guests.map(guest => (
                  <TableRow key={guest.id}>
                    <TableCell>{guest.macAddress}</TableCell>
                    <TableCell>{guest.ipAddress}</TableCell>
                    <TableCell>{formatDate(guest.connectedSince)}</TableCell>
                    <TableCell>{formatDate(guest.expiresAt)}</TableCell>
                    <TableCell>{formatTimeRemaining(guest.remainingTime)}</TableCell>
                    <TableCell>
                      {guest.dataLimitMB 
                        ? formatDataUsage(guest.dataUsedMB, guest.dataLimitMB)
                        : 'Unlimited'
                      }
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={guest.status}>
                        {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        danger 
                        onClick={() => {
                          setSelectedGuest(guest);
                          setShowDisconnectModal(true);
                        }}
                      >
                        Disconnect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {guests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan="8" style={{ textAlign: 'center' }}>
                      No active guests found
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          )}
        </TableContainer>
        
        {/* Disconnect Modal */}
        <Modal
          isOpen={showDisconnectModal}
          title="Disconnect Guest"
          onClose={() => setShowDisconnectModal(false)}
        >
          {selectedGuest && (
            <>
              <p>Are you sure you want to disconnect this guest?</p>
              <p><strong>MAC Address:</strong> {selectedGuest.macAddress}</p>
              <p><strong>IP Address:</strong> {selectedGuest.ipAddress}</p>
              <p>This will immediately terminate their connection to the network.</p>
              
              <ModalActions>
                <Button secondary onClick={() => setShowDisconnectModal(false)}>
                  Cancel
                </Button>
                <Button danger onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </ModalActions>
            </>
          )}
        </Modal>
      </Container>
    </AdminLayout>
  );
}

export default GuestManagement;