import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
  margin-bottom: 8px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Icon = styled.span`
  margin-right: 8px;
  font-size: 16px;
`;

function BackButton({ onClick }) {
  return (
    <Button onClick={onClick}>
      <Icon>←</Icon>
      Back
    </Button>
  );
}

export default BackButton;