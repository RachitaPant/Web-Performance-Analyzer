import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center">
      {icon && <div className="text-blue-500 mb-2 text-2xl">{icon}</div>}
      <h4 className="text-sm text-gray-500">{label}</h4>
      <p className="text-lg">{value}</p>
    </div>
  );
};

export default MetricCard;
