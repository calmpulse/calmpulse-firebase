// components/Spinner.tsx
export default function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-purple-600">
      <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-75"
        />
      </svg>
      <p className="mt-4 font-medium tracking-wide">Loading your progress…</p>
    </div>
  );
}
