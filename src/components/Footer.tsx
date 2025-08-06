
import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">ArqDoor</h3>
            <p className="text-gray-300">Conectando clientes aos arquitetos e projetistas ideais para cada tipo de projeto.</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Para clientes</h4>
            <ul className="space-y-2">
              <li><Link href="/#how-it-works"><span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Como funciona</span></Link></li>
              <li><Link href="/marketplace"><span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Encontre um profissional</span></Link></li>
              <li><Link href="/#testimonials"><span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Depoimentos</span></Link></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Inspirações de projeto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Para profissionais</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cadastre-se na plataforma</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Recursos e materiais</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Histórias de sucesso</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Comunidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Institucional</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Quem somos</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Trabalhe conosco</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Imprensa</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Fale conosco</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">&copy; {new Date().getFullYear()} ArqDoor. Todos os direitos reservados.</p>
          <div className="flex space-x-6">
            <a href="https://www.instagram.com/zameedapp" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-instagram text-xl" />
            </a>
            <a href="https://www.linkedin.com/company/zameedapp" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-linkedin text-xl" />
            </a>
            <a href="https://www.facebook.com/zameedapp" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-facebook text-xl" />
            </a>
            <a href="https://www.youtube.com/@zameedapp" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-youtube text-xl" />
            </a>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-whatsapp text-xl" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

