import './mutualItem.css';

export const MutualItem = ({
  icon,
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  onClick: () => void;
}) => (
  <div className='mutual-card' onClick={onClick}>
    <div className='mutual-card-icon'>
      {icon && icon != '' ? (
        <img src={icon} alt={`${title}'s Icon`} />
      ) : (
        <div className={'mutual-icon no-icon guild-icon no-icon no-hover-pls'}>{title[0]}</div>
      )}
    </div>
    <div className='mutual-card-info'>
      <div className='mutual-card-title'>{title}</div>
      {subtitle && <div className='mutual-card-subtitle'>{subtitle}</div>}
    </div>
    <span className='material-symbols-rounded mutual-card-arrow'>chevron_right</span>
  </div>
);
