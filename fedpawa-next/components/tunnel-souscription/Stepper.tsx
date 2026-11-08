import React from 'react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export const Stepper = ({ currentStep, totalSteps, labels }: StepperProps) => {
  return (
    <div className="stepper-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
      {labels.map((label, index) => (
        <div key={label} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          color: index <= currentStep ? 'var(--color-gold)' : '#ccc' 
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: index <= currentStep ? 'var(--color-gold)' : '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
            color: index <= currentStep ? '#fff' : '#888',
            fontWeight: 'bold'
          }}>
            {index + 1}
          </div>
          <span style={{ fontSize: '0.8rem', textAlign: 'center' }}>{label}</span>
        </div>
      ))}
    </div>
  );
};
