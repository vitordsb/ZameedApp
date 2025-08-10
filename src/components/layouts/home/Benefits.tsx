
const Benefits = () => {
  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Por que usar o ArqDoor?</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold flex items-center mb-2">
                <svg className="w-6 h-6 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Rede de profissionais verificados
              </h3>
              <p className="text-gray-600">Encontre arquitetos e projetistas com portfólios validados, prontos para atender projetos residenciais, comerciais e corporativos.</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold flex items-center mb-2">
                <svg className="w-6 h-6 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Orçamentos claros e sem surpresas
              </h3>
              <p className="text-gray-600">Compare valores e escopos de forma transparente. Escolha o profissional que se encaixa no seu orçamento com confiança.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold flex items-center mb-2">
                <svg className="w-6 h-6 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Gestão de projeto integrada
              </h3>
              <p className="text-gray-600">Troque mensagens, envie arquivos e acompanhe entregas com ferramentas integradas para facilitar sua obra do início ao fim.</p>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80" 
              alt="Colaboração em projeto de interiores" 
              className="rounded-lg shadow-xl" 
              width="600" 
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;

