import React from 'react';
import { XCircle } from 'lucide-react';
interface InputFieldProps {
  label: string;
  placeholder: string;
  inputType: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}
const InputField: React.FC<InputFieldProps> = ({ label, placeholder, inputType, value, onChange, onClear }) => {
  return (
    <div className="relative text-zinc-800">
      <div style={{ fontSize: '1.3rem', fontWeight: '500', fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif" }}>
        {label}
      </div>
      <input
        className="pl-2.5 justify-around w-full py-4 white-nowrap bg-white rounded-2xl text-zinc-800 border border-gray-300 items-center overflow-x-auto salts gap-2.5 inline-flex px-2"
        placeholder={placeholder}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && onClear && (
        <XCircle
          className="absolute transform -translate-y-10 -translate-x-10 right-0.5 cursor-pointer text-orange-300"
          onClick={onClear}
        />
      )}
    </div>
  );
};

export default InputField;
