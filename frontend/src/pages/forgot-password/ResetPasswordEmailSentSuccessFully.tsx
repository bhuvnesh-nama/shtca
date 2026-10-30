import React from "react";

const ResetPasswordEmailSentSuccessfully: React.FC = () => {
  return (
    <div className="rps-wrap h-screen items-center" role="status" aria-live="polite">
      <style>{`
        .rps-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 20px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
          background-color: #ffffff; /* White background */
          color: #111111; /* Default text color */
        }
        .rps-check {
          width: 88px;
          height: 88px;
          display: inline-block;
          margin-bottom: 16px;
          animation: rps-scale 0.4s ease both;
        }
        .rps-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111111; /* Always dark text */
          margin: 8px 0 6px;
        }
        .rps-sub {
          max-width: 420px;
          color: #333333; /* Dark gray text */
          margin: 0 auto;
          font-size: 0.98rem;
          line-height: 1.45;
        }
        .rps-card {
          animation: rps-fade 0.6s ease both;
        }

        /* SVG styles */
        .rps-circle-fill {
          fill: #22c55e;
          // filter: drop-shadow(0 6px 18px rgba(34, 197, 94, 0.35));
        }
        .rps-circle-outline {
          // stroke: #22c55e;
          stroke-width: 5;
          fill: none;
          stroke-linecap: round;
          stroke-miterlimit: 10;
          stroke-dasharray: 0 157;
          animation: rps-circle 0.6s ease forwards;
        }
        .rps-tick {
          fill: none;
          stroke: #fff;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: rps-tick 0.3s ease 0.6s forwards;
        }

        /* Animations */
        @keyframes rps-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rps-scale {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes rps-circle {
          from { stroke-dasharray: 0 157; }
          to { stroke-dasharray: 157 0; }
        }
        @keyframes rps-tick {
          to { stroke-dashoffset: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rps-card, .rps-check, .rps-circle-outline, .rps-tick { animation: none; }
        }
      `}</style>

      <div className="rps-card">
        <svg className="rps-check" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="rps-circle-fill" cx="26" cy="26" r="25" />
          <circle className="rps-circle-outline" cx="26" cy="26" r="25" />
          <path className="rps-tick" d="M14 27l7 7 16-16" />
        </svg>

        <h2 className="rps-title">Password Reset Email Sent!</h2>
        <p className="rps-sub">
          Please check your inbox and follow the link to reset your password.
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordEmailSentSuccessfully;
