import Link from "next/link";

export default function Header(){
    return (<div className="flex-row w-[80%] items-center justify-center flex gap-16 text-black shadow-md bg-white p-3 rounded-2xl my-3">
        <Link href="">Home</Link>
        <Link href="">About</Link>
        <Link href="">Contact</Link>
        <Link href="">Help</Link>
        
    </div>)
}