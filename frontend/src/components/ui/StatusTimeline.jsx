import React from 'react';
import { Check, X, Clock, Calendar, Truck, PackageCheck, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'requested', label: 'Requested', icon: Clock },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  { id: 'handover_set', label: 'Handover Set', icon: Calendar },
  { id: 'dispatched', label: 'Dispatched', icon: Truck },
  { id: 'received', label: 'Received', icon: PackageCheck },
  { id: 'completed', label: 'Completed', icon: Check },
];

const normalizeStatus = (status) => {
  if (!status) return 0;
  const s = String(status).toLowerCase();
  if (s === 'rejected') return -1;
  if (s === 'cancelled') return -2;
  if (s === 'completed') return 5;
  if (s === 'received' || s === 'recipient_confirmed') return 4;
  if (s === 'dispatched' || s === 'donor_confirmed') return 3;
  if (s === 'handover_scheduled' || s === 'handover_set' || s === 'scheduled') return 2;
  if (s === 'approved') return 1;
  if (s === 'requested' || s === 'pending') return 0;
  return 0;
};

export const StatusTimeline = ({ currentStatus = 'requested', className = '' }) => {
  const currentStepIndex = normalizeStatus(currentStatus);
  const isRejected = currentStepIndex === -1;
  const isCancelled = currentStepIndex === -2;

  if (isRejected || isCancelled) {
    return (
      <div className={`p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <X className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h4 className="font-semibold capitalize text-red-900">Request {isRejected ? 'Rejected' : 'Cancelled'}</h4>
          <p className="text-sm text-red-600">
            This request has been {isRejected ? 'rejected by the donor' : 'cancelled'}. No further handover actions can be taken.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="relative">
        {/* Progress Bar background */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-gray-200 -z-0 hidden md:block">
          <div
            className="h-1 bg-primary-600 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isFuture = idx > currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    isCompleted
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCurrent
                      ? 'bg-white border-primary-600 text-primary-600 ring-4 ring-primary-100'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="mt-2.5">
                  <span
                    className={`text-xs font-semibold block ${
                      isCurrent
                        ? 'text-primary-700'
                        : isCompleted
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {isCompleted ? 'Done' : isCurrent ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
