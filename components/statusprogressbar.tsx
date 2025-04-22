import React from 'react';

interface Props {
  status: string;
  type?: string;
  emailSent?: boolean;
}

const StatusProgressBar: React.FC<Props> = ({ status, type, emailSent }) => {
  let progress = 0;
  let progressColor = '#e8a627';

  if (status === 'pendingreport') {
    progress = 50;
    progressColor = type === 'found' ? '#e8a627' : '#e8a627';
  } else if (status === 'pendingclaim') {
    progress = emailSent ? 100 : 50;
    progressColor = emailSent ? '#e8a627' : '#e8a627';
  }

  return (
    <div className="progress my-2" 
        style={{  
            backgroundColor: 'white', 
            overflow: 'hidden', 
            height: '6px', 
            border:'none',
            borderRadius: '4px' }}>
      <div
        className="progress-bar"
        role="progressbar"
        style={{
          width: `${progress}%`,
          backgroundColor:progressColor,
        }}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
    </div>
  );
};

export default StatusProgressBar;
