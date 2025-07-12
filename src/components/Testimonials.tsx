const Testimonials = () => {
  const testimonials = [
    {
      name: "Fernanda Lima",
      role: "Proprietária de imóvel",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      quote: "Contratar um arquiteto pelo ZameedApp foi muito mais fácil do que eu imaginava. Pude ver portfólios e conversar com profissionais antes de decidir. O projeto da minha casa ficou exatamente como sonhei!"
    },
    {
      name: "André Oliveira",
      role: "Arquiteto",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      quote: "A plataforma me trouxe muitos clientes novos. Eu consigo mostrar meus projetos e gerenciar tudo em um só lugar, o que economiza muito tempo no dia a dia."
    },
    {
      name: "Juliana Martins",
      role: "Empresária",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      quote: "Usei o ZameedApp para reformar o escritório da minha empresa. Achei uma arquiteta incrível, com preço justo e excelente atendimento. Recomendo para quem busca algo profissional e sem dor de cabeça."
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">O que nossos usuários dizem</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-lg">
              <div className="flex items-center mb-4">
                <img src={testimonial.image} alt={`Foto de ${testimonial.name}`} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

