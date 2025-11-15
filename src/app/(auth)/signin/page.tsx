import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { AuthForm } from "@/components/authForm";



export default function Page(){

    return (
      <>
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/background/background.png')" }}>
          <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg w-[520px] h-[700px] overflow-y-auto">
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={100}
              height={100}
              className="mb-6 mx-auto"
            />
            <AuthForm />
          </div>
        </div>
      </>
      );

}
