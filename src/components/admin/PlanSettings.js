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

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${({ theme }) => theme.colors.primary};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 119, 204, 0.2);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
`;

function PlanSettings() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    durationHours: 1,
    dataLimitMB: 0,
    downloadSpeedKbps: 0,
    uploadSpeedKbps: 0,
    priceInCents: 0,
    maxDevices: 1,
    active: true
  });
  
  const { api } = useAPI();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.getPlanSettings();
      setPlans(response.data);
    } catch (error) {
      showAlert('Error loading plans', 'danger');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'name' ? value : parseInt(value, 10))
    }));
  };

  const handleToggleStatus = async (planId, currentStatus) => {
    try {
      const plan = plans.find(p => p.id === planId);
      await api.updatePlan(planId, { ...plan, active: !currentStatus });
      fetchPlans();
    } catch (error) {
      showAlert('Error updating plan status', 'danger');
      console.error('Error updating plan status:', error);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await api.createPlan(formData);
      showAlert('Plan created successfully', 'success');
      setShowCreateModal(false);
      fetchPlans();
    } catch (error) {
      showAlert('Error creating plan: ' + error.message, 'danger');
      console.error('Error creating plan:', error);
    }
  };

  const handleEditPlan = async () => {
    try {
      await api.updatePlan(selectedPlan.id, formData);
      showAlert('Plan updated successfully', 'success');
      setShowEditModal(false);
      fetchPlans();
    } catch (error) {
      showAlert('Error updating plan: ' + error.message, 'danger');
      console.error('Error updating plan:', error);
    }
  };

  const handleDeletePlan = async () => {
    try {
      await api.deletePlan(selectedPlan.id);
      showAlert('Plan deleted successfully', 'success');
      setShowDeleteModal(false);
      fetchPlans();
    } catch (error) {
      showAlert('Error deleting plan: ' + error.message, 'danger');
      console.error('Error deleting plan:', error);
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      durationHours: plan.durationHours,
      dataLimitMB: plan.dataLimitMB,
      downloadSpeedKbps: plan.downloadSpeedKbps,
      uploadSpeedKbps: plan.uploadSpeedKbps,
      priceInCents: plan.priceInCents,
      maxDevices: plan.maxDevices,
      active: plan.active
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      durationHours: 1,
      dataLimitMB: 0,
      downloadSpeedKbps: 0,
      uploadSpeedKbps: 0,
      priceInCents: 0,
      maxDevices: 1,
      active: true
    });
    setShowCreateModal(true);
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <AdminLayout>
      <Container>
        <PageHeader>
          <PageTitle>WiFi Plans</PageTitle>
          <Button onClick={openCreateModal}>Add New Plan</Button>
        </PageHeader>

        <TableContainer>
          {loading ? (
            <Spinner message="Loading plans..." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Duration</TableHeader>
                  <TableHeader>Data Limit</TableHeader>
                  <TableHeader>Speed</TableHeader>
                  <TableHeader>Price</TableHeader>
                  <TableHeader>Devices</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.durationHours} hour{plan.durationHours > 1 ? 's' : ''}</TableCell>
                    <TableCell>
                      {plan.dataLimitMB 
                        ? plan.dataLimitMB >= 1024 
                          ? `${(plan.dataLimitMB / 1024).toFixed(1)} GB` 
                          : `${plan.dataLimitMB} MB`
                        : 'Unlimited'
                      }
                    </TableCell>
                    <TableCell>
                      {plan.downloadSpeedKbps 
                        ? `${(plan.downloadSpeedKbps / 1024).toFixed(1)}/${(plan.uploadSpeedKbps / 1024).toFixed(1)} Mbps`
                        : 'Unlimited'
                      }
                    </TableCell>
                    <TableCell>{formatCurrency(plan.priceInCents)}</TableCell>
                    <TableCell>{plan.maxDevices}</TableCell>
                    <TableCell>
                      <Switch>
                        <SwitchInput 
                          type="checkbox" 
                          checked={plan.active} 
                          onChange={() => handleToggleStatus(plan.id, plan.active)}
                        />
                        <SwitchSlider />
                      </Switch>
                    </TableCell>
                    <TableCell>
                      <Button secondary onClick={() => openEditModal(plan)}>
                        Edit
                      </Button>
                      {' '}
                      <Button danger onClick={() => openDeleteModal(plan)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan="8" style={{ textAlign: 'center' }}>
                      No plans found
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          )}
        </TableContainer>
        
        {/* Create Plan Modal */}
        <Modal
          isOpen={showCreateModal}
          title="Create New Plan"
          onClose={() => setShowCreateModal(false)}
        >
          <FormGroup>
            <Label htmlFor="name">Plan Name</Label>
            <Input 
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Basic Hour"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="durationHours">Duration (hours)</Label>
            <Input 
              type="number"
              id="durationHours"
              name="durationHours"
              value={formData.durationHours}
              onChange={handleInputChange}
              min="1"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="dataLimitMB">Data Limit (MB, 0 for unlimited)</Label>
            <Input 
              type="number"
              id="dataLimitMB"
              name="dataLimitMB"
              value={formData.dataLimitMB}
              onChange={handleInputChange}
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="downloadSpeedKbps">Download Speed (Kbps, 0 for unlimited)</Label>
            <Input 
              type="number"
              id="downloadSpeedKbps"
              name="downloadSpeedKbps"
              value={formData.downloadSpeedKbps}
              onChange={handleInputChange}
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="uploadSpeedKbps">Upload Speed (Kbps, 0 for unlimited)</Label>
            <Input 
              type="number"
              id="uploadSpeedKbps"
              name="uploadSpeedKbps"
              value={formData.uploadSpeedKbps}
              onChange={handleInputChange}
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="priceInCents">Price (in cents)</Label>
            <Input 
              type="number"
              id="priceInCents"
              name="priceInCents"
              value={formData.priceInCents}
              onChange={handleInputChange}
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="maxDevices">Max Devices</Label>
            <Input 
              type="number"
              id="maxDevices"
              name="maxDevices"
              value={formData.maxDevices}
              onChange={handleInputChange}
              min="1"
            />
          </FormGroup>
          
          <ModalActions>
            <Button secondary onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>
              Create Plan
            </Button>
          </ModalActions>
        </Modal>
        
        {/* Edit Plan Modal */}
        <Modal
          isOpen={showEditModal}
          title="Edit Plan"
          onClose={() => setShowEditModal(false)}
        >
          {selectedPlan && (
            <>
              <FormGroup>
                <Label htmlFor="name">Plan Name</Label>
                <Input 
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="durationHours">Duration (hours)</Label>
                <Input 
                  type="number"
                  id="durationHours"
                  name="durationHours"
                  value={formData.durationHours}
                  onChange={handleInputChange}
                  min="1"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="dataLimitMB">Data Limit (MB, 0 for unlimited)</Label>
                <Input 
                  type="number"
                  id="dataLimitMB"
                  name="dataLimitMB"
                  value={formData.dataLimitMB}
                  onChange={handleInputChange}
                  min="0"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="downloadSpeedKbps">Download Speed (Kbps, 0 for unlimited)</Label>
                <Input 
                  type="number"
                  id="downloadSpeedKbps"
                  name="downloadSpeedKbps"
                  value={formData.downloadSpeedKbps}
                  onChange={handleInputChange}
                  min="0"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="uploadSpeedKbps">Upload Speed (Kbps, 0 for unlimited)</Label>
                <Input 
                  type="number"
                  id="uploadSpeedKbps"
                  name="uploadSpeedKbps"
                  value={formData.uploadSpeedKbps}
                  onChange={handleInputChange}
                  min="0"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="priceInCents">Price (in cents)</Label>
                <Input 
                  type="number"
                  id="priceInCents"
                  name="priceInCents"
                  value={formData.priceInCents}
                  onChange={handleInputChange}
                  min="0"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="maxDevices">Max Devices</Label>
                <Input 
                  type="number"
                  id="maxDevices"
                  name="maxDevices"
                  value={formData.maxDevices}
                  onChange={handleInputChange}
                  min="1"
                />
              </FormGroup>
              
              <ModalActions>
                <Button secondary onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPlan}>
                  Save Changes
                </Button>
              </ModalActions>
            </>
          )}
        </Modal>
        
        {/* Delete Plan Modal */}
        <Modal
          isOpen={showDeleteModal}
          title="Delete Plan"
          onClose={() => setShowDeleteModal(false)}
        >
          {selectedPlan && (
            <>
              <p>Are you sure you want to delete the plan "{selectedPlan.name}"?</p>
              <p>This action cannot be undone.</p>
              
              <ModalActions>
                <Button secondary onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button danger onClick={handleDeletePlan}>
                  Delete
                </Button>
              </ModalActions>
            </>
          )}
        </Modal>
      </Container>
    </AdminLayout>
  );
}

export default PlanSettings;