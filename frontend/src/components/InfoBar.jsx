import { Link } from "react-router-dom";

export default function InfoBar() {
  return (
    <div className="text-center animate-slideFadeIn" style={{ backgroundColor: "#FFF5EC" }}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="relative">
          <p className="ml-3 text-black font-medium">
            <span className="mr-2">©</span>
            <span>
              {new Date().getFullYear()} <strong>My Website</strong>. All rights reserved.{" "}
              <Link to="/privacy-policy" className="border-b-2 border-black">
                Privacy Policy
              </Link>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
