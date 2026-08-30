export default function NavBar({ role, onLogout }) {
  return (
    <div className="w-full p-4 bg-gray-100 flex justify-between">
      <div className="font-semibold">EMS</div>
      <div className="flex gap-4 items-center">
        <span className="text-sm">Role: {role}</span>
        <button className="px-3 py-1 bg-black text-white rounded" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
