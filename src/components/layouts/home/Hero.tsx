import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react"

const Hero = () => {
  const [text, setText] = useState<string>("Comece a usar agora")

   useEffect (() => {
     if (sessionStorage.getItem("token")) {
         setText("Continuar usando, você está online!")
     }
   }, [])

 return (
    <section 
      className="flex items-center justify-center" 
      style={{ 
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9)), url('https://www.weg.net/weghome/wp-content/uploads/2017/12/arquitetura-e-urbanismo.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "85vh"
      }}
    >
      <div className="container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Sua casa dos sonhos com segurança e velocidade</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">Encontre os melhores arquitetos e engenheiros para realizar os seus sonhos com o máximo de segurança</p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/home">
            <Button className="bg-amber-500 text-white px-8 py-6 rounded-full text-lg font-semibold hover:bg-amber-600 transition-all flex">
              {text}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
