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
          onClick={() => router.push("/camb")}
          className="w-full py-3 border border-white text-white rounded-lg transition hover:bg-white hover:text-black"
        >
          Text to speech using camb
        </button>

            <button
          onClick={() => router.push("/elevn")}
          className="w-full py-3 border border-white text-white rounded-lg transition hover:bg-white hover:text-black"
        >
          Text to speech using elevenlabs(not working due to overeuse of free trial key)
        </button>
      </div>
    </div>
  );
};

export default Page;