import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import bueLogo from "@/assets/bue-logo.png.asset.json";

export const Route = createFileRoute("/student/feedback/success")({
  head: () => ({
    meta: [{ title: "Feedback Submitted | BUE Feedback Portal" }],
  }),
  component: FeedbackSuccess,
});

function FeedbackSuccess() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8 sm:p-12 flex flex-col items-center text-center">
        <img src={bueLogo.url} alt="BUE" className="h-14 w-auto mb-6" />
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "#00BCD4" }}
        >
          <CheckCircle2 size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Thank you for your feedback!
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your response has been recorded successfully.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            to="/student"
            className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium text-sm hover:bg-neutral-50 text-center"
          >
            Back to Dashboard
          </Link>
          <Link
            to="/student/feedback"
            className="px-5 py-2.5 rounded-lg text-white font-medium text-sm text-center"
            style={{ backgroundColor: "#00BCD4" }}
          >
            Submit Another
          </Link>
        </div>
      </div>
    </div>
  );
}
