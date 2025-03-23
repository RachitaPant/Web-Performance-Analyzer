import React from 'react';

interface PerformanceResultsProps {
  metrics: {
    navigationTiming: Record<string, any>;
    paintTiming: any[];
    resourceTiming: any[];
  };
  networkRequests: any[];
  jsExecutionTime: number;
}

const PerformanceResults: React.FC<PerformanceResultsProps> = ({ metrics, networkRequests, jsExecutionTime }) => {
  return (
    <div>
      <h2>Performance Results</h2>

     

     

    

    
    </div>
  );
};

export default PerformanceResults;