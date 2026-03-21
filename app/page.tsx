"use client"
import { useRouter } from "next/navigation";

const page = () => {

  const router = useRouter()
  return (
    <div>Test to speech
      <button onClick={() => router.push("/climb")}>Text to speech using climb</button>
    </div>
  )
}

export default page