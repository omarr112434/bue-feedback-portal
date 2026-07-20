import { createFileRoute, Link } from "@tanstack/react-router";
import bueLogo from "@/assets/bue-logo.png.asset.json";

export const Route = createFileRoute("/student/feedback/success")({
  head: () => ({
    meta: [{ title: "Feedback Submitted | BUE Feedback Portal" }],
  }),
  component: FeedbackSuccess,
});

function FeedbackSuccess() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 animate-fade-in">
      <style>{`
        @keyframes checkmark-circle {
          0% {
            stroke-dashoffset: 166;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes checkmark-check {
          0% {
            stroke-dashoffset: 48;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        .checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: checkmark-circle 0.6s ease-in-out forwards;
        }
        .checkmark-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          opacity: 0;
          animation: checkmark-check 0.4s ease-in-out 0.5s forwards;
        }
      `}</style>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 sm:p-10 flex flex-col items-center text-center">
        <img src={bueLogo.url} alt="The British University in Egypt" className="h-12 w-auto mb-8" />

        <div className="relative w-24 h-24 mb-6">
          <svg className="w-full h-full" viewBox="0 0 52 52">
            <circle
              className="checkmark-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
            />
            <path
              className="checkmark-check"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27 L22 35 L38 17"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          Feedback Submitted Successfully!
        </h1>
        <p className="mt-3 text-sm sm:text-base text-neutral-600">
          Thank you for your feedback. It helps us improve your learning experience at BUE!
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to="/student"
            className="flex-1 px-5 py-2.5 rounded-lg text-white font-medium text-sm text-center hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#00BCD4" }}
          >
            Back to Dashboard
          </Link>
          <Link
            to="/student/feedback"
            className="flex-1 px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium text-sm hover:bg-neutral-50 text-center transition-colors"
          >
            Submit Another
          </Link>
        </div>
      </div>
    </div>
  );
}
