import React from 'react';
import styled from 'styled-components';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: ${({ small }) => small ? '32px' : '40px'};
`;

function Logo({ small }) {
  return (
    <LogoContainer>
      <LogoImage 
        src="/assets/logo.svg" 
        alt="UniFi Guest Portal" 
        small={small} 
      />
    </LogoContainer>
  );
}

export default Logo;