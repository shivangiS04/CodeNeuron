"use client";

export default function VoteButton({
  direction,
  active,
  onClick,
}: {
  direction: 1 | -1;
  active: boolean;
  onClick: () => void;
}) {
  const up = direction === 1;
  return (
    <button
      onClick={onClick}
      title={up ? "Upvote" : "Downvote"}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors ${
        active
          ? up
            ? "border-green-500/50 bg-green-500/20 text-green-400"
            : "border-red-500/50 bg-red-500/20 text-red-400"
          : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
      }`}
    >
      {up ? "▲" : "▼"}
    </button>
  );
}
