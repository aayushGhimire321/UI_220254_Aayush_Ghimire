import { Link } from "react-router-dom";

export default function InfoBar() {
  return (
    <div className=" bg-[#F2994A] text-center">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="relative">
          <p className="ml-3 text-white font-medium">
            <span>
           Copyright &copy; {new Date().getFullYear()} JobPortal. All rights reserved.            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
