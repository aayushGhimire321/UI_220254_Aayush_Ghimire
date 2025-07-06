import { useState } from "react";


export default function PasswordInput({ value, onChange, placeholder }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type={isFocused ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
}