import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../../contexts/AuthContext';
import Logo from '../../common/Logo';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: ${({ expanded }) => expanded ? '240px' : '70px'};
  background-color: ${({ theme }) => theme.colors.dark};
  color: ${({ theme }) => theme.colors.white};
  transition: width 0.3s ease-in-out;
  overflow: hidden;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: fixed;
    z-index: 1000;
    height: 100%;
    left: ${({ expanded }) => expanded ? '0' : '-70px'};
    box-shadow: ${({ expanded }) => expanded ? '0 0 15px rgba(0, 0, 0, 0.2)' : 'none'};
  }
`;

const SidebarHeader = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: ${({ expanded }) => expanded ? 'space-between' : 'center'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SidebarToggle = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 30px;
  height: 30px;
`;

const SidebarContent = styled.div`
  padding: 16px 0;
`;

const SidebarLink = styled.a`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: ${({ theme, active }) => active ? theme.colors.white : 'rgba(255, 255, 255, 0.7)'};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: ${({ theme }) => theme.colors.white};
  }
  
  ${({ active, theme }) => active && `
    background-color: ${theme.colors.primary};
    
    &:hover {
      background-color: ${theme.colors.primary};
    }
  `}
`;

const LinkIcon = styled.span`
  margin-right: ${({ expanded }) => expanded ? '12px' : '0'};
  font-size: 18px;
  width: 20px;
  text-align: center;
`;

const LinkText = styled.span`
  white-space: nowrap;
  opacity: ${({ expanded }) => expanded ? 1 : 0};
  transition: opacity 0.2s ease-in-out;
`;

const MainContent = styled.main`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const TopBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white};
  font-weight: 600;
  margin-right: 8px;
`;

const UserDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 100;
  display: ${({ open }) => open ? 'block' : 'none'};
`;

const UserDropdownItem = styled.a`
  display: block;
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.dark};
  text-decoration: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.light};
  }
`;

const PageContent = styled.div`
  flex: 1;
`;

function AdminLayout({ children }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
    history.push('/admin/login');
  };

  const handleNavigation = (path) => {
    history.push(path);
    if (window.innerWidth < 768) {
      setSidebarExpanded(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', text: 'Dashboard' },
    { path: '/admin/vouchers', icon: '🎟️', text: 'Vouchers' },
    { path: '/admin/payments', icon: '💰', text: 'Payments' },
    { path: '/admin/guests', icon: '👥', text: 'Guests' },
    { path: '/admin/plans', icon: '📋', text: 'Plans' },
    { path: '/admin/settings', icon: '⚙️', text: 'Settings' },
  ];

  return (
    <LayoutContainer>
      <Sidebar expanded={sidebarExpanded}>
        <SidebarHeader expanded={sidebarExpanded}>
          {sidebarExpanded && <Logo small />}
          <SidebarToggle onClick={toggleSidebar}>
            {sidebarExpanded ? '◀' : '▶'}
          </SidebarToggle>
        </SidebarHeader>

        <SidebarContent>
          {menuItems.map(item => (
            <SidebarLink
              key={item.path}
              active={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <LinkIcon expanded={sidebarExpanded}>{item.icon}</LinkIcon>
              <LinkText expanded={sidebarExpanded}>{item.text}</LinkText>
            </SidebarLink>
          ))}
        </SidebarContent>
      </Sidebar>

      <MainContent>
        <TopBar>
          <MobileMenuToggle onClick={toggleSidebar}>
            ☰
          </MobileMenuToggle>

          <UserMenu>
            <UserButton onClick={toggleUserMenu}>
              <UserAvatar>
                {currentUser?.name ? getInitials(currentUser.name) : 'A'}
              </UserAvatar>
              {currentUser?.name || 'Admin'}
            </UserButton>

            <UserDropdown open={userMenuOpen}>
              <UserDropdownItem onClick={handleLogout}>
                Logout
              </UserDropdownItem>
            </UserDropdown>
          </UserMenu>
        </TopBar>

        <PageContent>
          {children}
        </PageContent>
      </MainContent>
    </LayoutContainer>
  );
}

export default AdminLayout;