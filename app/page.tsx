"use client";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">
          Text to Speech
        </h1>

        <button
          onClick={() => router.push("/climb")}
          className="w-full py-3 border border-white text-white rounded-lg transition hover:bg-white hover:text-black"
        >
          Text to speech using climb
        </button>

            <button
          onClick={() => router.push("/elevn")}
          className="w-full py-3 border border-white text-white rounded-lg transition hover:bg-white hover:text-black"
        >
          Text to speech using 11Labs
        </button>
      </div>
    </div>
  );
};

export default Page;