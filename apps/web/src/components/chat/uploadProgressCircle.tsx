import './uploadProgressCircle.css';

export const UploadProgressCircle = ({ loaded, total }: { loaded: number; total: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = loaded / total;
  const offset = circumference - progress * circumference;

  const mbLoaded = (loaded / 1024 / 1024).toFixed(1);
  const mbTotal = (total / 1024 / 1024).toFixed(1);

  return (
    <div className='upload-overlay'>
      <div className='upload-container-inner'>
        <svg width='40' height='40' className='progress-ring'>
          <circle
            className='progress-ring-circle'
            strokeWidth='3'
            fill='transparent'
            r={radius}
            cx='20'
            cy='20'
            style={{
              strokeDasharray: `${circumference.toString()} ${circumference.toString()}`,
              strokeDashoffset: offset.toString(),
            }}
          />
        </svg>
        <div className='upload-text'>{`${mbLoaded}MB / ${mbTotal}MB`}</div>
      </div>
    </div>
  );
};
