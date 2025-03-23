interface PerformanceAdviceProps {
    advice: string;
  }
  
  const PerformanceAdvice: React.FC<PerformanceAdviceProps> = ({ advice }) => {
    return (
      <div className="mt-6 p-4 border rounded-md bg-gray-100">
        <h2 className="text-xl font-semibold">Performance Advice</h2>
        <pre className="whitespace-pre-wrap">{advice}</pre>
      </div>
    );
  };
  
  export default PerformanceAdvice;
  