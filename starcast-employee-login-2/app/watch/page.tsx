import React from "react";

export const metadata = {
  title: "Watch - Starcast",
  description: "Watch our YouTube videos",
};

export default function WatchPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#05052d] text-[#f5f7ff]">
      <h1 className="text-3xl font-bold mb-6">Watch Our Videos</h1>
      <iframe
        className="w-full max-w-4xl h-96"
        src="https://www.youtube.com/embed?listType=user_uploads&list=starcastlivemedia"
        title="Starcast YouTube Channel"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </main>
  );
}
