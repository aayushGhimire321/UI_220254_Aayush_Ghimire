export default function InfoBar() {
  return (
    <div className="bg-[#F2994A] text-center">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <p className="text-white font-medium">
          © {new Date().getFullYear()} Job Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
