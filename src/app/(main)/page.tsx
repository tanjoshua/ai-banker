import Image from "next/image";
import Link from "next/link";

export default function MainPage() {
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background justify-center items-center">
        <div className="grid gap-8">

          <div className="text-4xl font-bold">{"LOOK AT HIM. THAT'S MY QUANT"}</div>
          <Image src="/main/myquant.png" alt="My Quant" width={500} height={0} className="w-full h-auto" />

          <Link href="/analyst">
            <button>
              Begin
            </button>
          </Link>
        </div>
      </div>


    </>
  );
}
