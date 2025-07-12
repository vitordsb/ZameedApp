
const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Como funciona o ZameedApp</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Etapa 1 */}
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-3xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold mb-4">Encontre profissionais</h3>
            <p className="text-gray-600">Navegue por portfólios de arquitetos e projetistas. Filtre por estilo, localização e faixa de preço para encontrar o ideal para o seu projeto.</p>
          </div>
          
          {/* Etapa 2 */}
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-3xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold mb-4">Converse sem intermediários</h3>
            <p className="text-gray-600">Entre em contato direto com o profissional. Apresente sua ideia, tire dúvidas e alinhe expectativas com clareza.</p>
          </div>
          
          {/* Etapa 3 */}
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-3xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold mb-4">Colabore e acompanhe</h3>
            <p className="text-gray-600">Gerencie o projeto do início ao fim pela plataforma. Compartilhe arquivos, aprove entregas e acompanhe o progresso em tempo real.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

