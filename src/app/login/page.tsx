'use client';

import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/supabaseClient"; 
import { useEffect } from "react";
import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/Button/page"
import { Input } from "@/components/Input/page"

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'http://localhost:3000',
      },
    });
    
  };

  return (
  <> <div className="flex h-screen w-full">
     
      <div className="relative hidden md:flex md:w-1/2 bg-black overflow-hidden">
        <Image src="/images/login/cosmic.jpg" alt="Cosmic landscape" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

      
        <div className="relative z-10 flex flex-col justify-between w-full h-full p-8">
       
          <div className="flex justify-between items-center">
            <div className="text-white font-medium">Improving Your Online Experience</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-white border-white/30 bg-white/10 hover:bg-white/20">
                Sign Up
              </Button>
              <Button size="sm" className="bg-white text-black hover:bg-white/90">
                Join Us
              </Button>
            </div>
          </div>

        
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=40&width=40"
                  alt="Profile"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="text-white">
                <div className="font-medium">Rachita Pant</div>
                <div className="text-sm text-white/70">Design and Development</div>
              </div>
            </div>

            {/* Navigation arrows */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-8 h-8 text-white border-white/30 bg-white/10 hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-8 h-8 text-white border-white/30 bg-white/10 hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

   
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
         
          <div className="flex justify-between items-center mb-12">
            <div className="text-xl font-bold text-gray-600">AnalyzeAI</div>
           
          </div>

         
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-black">Hi Developer</h1>
              <p className="text-gray-800">Welcome to AnalyzeAi</p>
            </div>

            <div className="space-y-4">
              
          
             

              <Button onClick={()=>{handleLogin()}}  className="w-full bg-red-500 hover:bg-red-600 text-white">Login with Github</Button>

              <div className="text-center text-sm text-gray-500">
                Don't have an account?
                <Link onClick={()=>{handleLogin()}} href="#" className="text-red-500 hover:underline ml-1">
                  Sign up
                </Link>
              </div>
            </div>

           
            <div className="flex justify-center gap-4 pt-4">
              
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <Twitter size={20} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <Linkedin size={20} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <Instagram size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
   
  );
}
