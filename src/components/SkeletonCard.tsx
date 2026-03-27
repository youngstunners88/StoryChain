import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="skeleton h-5 w-48 rounded" />
        <div className="skeleton h-4 w-10 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="skeleton w-7 h-7 rounded-full" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}
