import './mutualItem.css';

import { type JSX } from 'react';

export const MutualItem = ({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string | JSX.Element;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) => (
  <div className='mutual-card' onClick={onClick}>
    <div className='mutual-card-icon'>
      {typeof icon === 'string' ? <img src={icon} alt='' /> : icon}
    </div>
    <div className='mutual-card-info'>
      <div className='mutual-card-title'>{title}</div>
      {subtitle && <div className='mutual-card-subtitle'>{subtitle}</div>}
    </div>
    <span className='material-symbols-rounded mutual-card-arrow'>chevron_right</span>
  </div>
);
