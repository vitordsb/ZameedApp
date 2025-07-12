import { useRoute } from "wouter";
import { Link } from "wouter";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarDays, Tag, User, ArrowLeft, Share2, Heart, MessageCircle, Eye } from "lucide-react";
import { useState } from "react";

// Dados de exemplo das notícias (em produção, viriam do backend)
const newsArticles = [
  {
    id: "1",
    title: "As 5 Tendências de Design de Interiores para 2025",
    author: "Equipe Zameed",
    date: "15 de Junho, 2025",
    category: "Tendências",
    image: "https://via.placeholder.com/800x400/FFD700/FFFFFF?text=Tendencias2025",
    summary: "Descubra as principais tendências que irão moldar o design de interiores no próximo ano, desde a sustentabilidade até a tecnologia integrada.",
    content: `
      <h2>Introdução</h2>
      <p>O mundo do design de interiores está em constante evolução, e 2025 promete trazer mudanças significativas na forma como concebemos e habitamos os nossos espaços. Desde a crescente preocupação com a sustentabilidade até à integração de tecnologias inteligentes, as tendências deste ano refletem uma sociedade que valoriza tanto o bem-estar quanto a funcionalidade.</p>
      
      <h2>1. Sustentabilidade em Primeiro Lugar</h2>
      <p>A sustentabilidade deixou de ser uma opção para se tornar uma necessidade. Em 2025, veremos um aumento significativo no uso de materiais reciclados, móveis vintage restaurados e soluções de design que minimizam o impacto ambiental. Os consumidores estão cada vez mais conscientes da pegada ecológica dos seus lares.</p>
      
      <h2>2. Tecnologia Integrada de Forma Invisível</h2>
      <p>A casa inteligente evolui para se tornar mais intuitiva e menos intrusiva. As tecnologias de automação residencial serão integradas de forma quase invisível, permitindo que a funcionalidade coexista harmoniosamente com a estética.</p>
      
      <h2>3. Cores Terrosas e Naturais</h2>
      <p>As paletas de cores de 2025 inspiram-se na natureza, com tons terrosos, verdes suaves e azuis oceânicos dominando os esquemas de decoração. Estas cores promovem uma sensação de calma e conexão com o ambiente natural.</p>
      
      <h2>4. Espaços Multifuncionais</h2>
      <p>Com o trabalho remoto a tornar-se cada vez mais comum, os espaços residenciais precisam de ser mais versáteis. Os designers estão a criar soluções inovadoras que permitem que um mesmo espaço sirva múltiplas funções ao longo do dia.</p>
      
      <h2>5. Texturas e Materiais Naturais</h2>
      <p>O uso de materiais naturais como madeira não tratada, pedra natural e fibras orgânicas ganha destaque. Estas texturas adicionam profundidade e interesse visual aos espaços, criando ambientes mais acolhedores e autênticos.</p>
      
      <h2>Conclusão</h2>
      <p>As tendências de 2025 refletem uma mudança em direção a espaços mais conscientes, funcionais e conectados com a natureza. Ao incorporar estas tendências nos seus projetos, os designers podem criar ambientes que não apenas são visualmente atraentes, mas também promovem o bem-estar e a sustentabilidade.</p>
    `,
    views: 1250,
    likes: 89,
    comments: 23
  },
  {
    id: "2",
    title: "Como Contratar o Arquiteto Certo para o Seu Projeto",
    author: "Maria Silva",
    date: "10 de Junho, 2025",
    category: "Dicas",
    image: "https://via.placeholder.com/800x400/87CEEB/FFFFFF?text=ContratarArquiteto",
    summary: "Um guia completo para ajudá-lo a escolher o profissional ideal para transformar a sua visão em realidade, com dicas práticas e pontos a considerar.",
    content: `
      <h2>Introdução</h2>
      <p>Contratar o arquiteto certo pode fazer a diferença entre um projeto bem-sucedido e uma experiência frustrante. Este guia oferece dicas práticas para ajudá-lo a tomar a melhor decisão.</p>
      
      <h2>1. Defina o Seu Orçamento</h2>
      <p>Antes de começar a procurar, tenha uma ideia clara do seu orçamento total. Isto ajudará a filtrar os profissionais que se adequam às suas possibilidades financeiras.</p>
      
      <h2>2. Analise o Portfólio</h2>
      <p>Examine cuidadosamente os trabalhos anteriores do arquiteto. Procure projetos similares ao seu e avalie se o estilo do profissional alinha com a sua visão.</p>
      
      <h2>3. Verifique Referências</h2>
      <p>Contacte clientes anteriores para obter feedback sobre a experiência de trabalhar com o arquiteto. Pergunte sobre prazos, comunicação e qualidade do trabalho.</p>
      
      <h2>4. Avalie a Comunicação</h2>
      <p>Um bom arquiteto deve ser um excelente comunicador. Durante as primeiras reuniões, observe se o profissional ouve as suas ideias e consegue explicar conceitos de forma clara.</p>
      
      <h2>5. Considere a Localização</h2>
      <p>Embora não seja obrigatório, trabalhar com um arquiteto local pode facilitar reuniões presenciais e o acompanhamento da obra.</p>
    `,
    views: 890,
    likes: 67,
    comments: 15
  },
  {
    id: "3",
    title: "A Revolução da IA na Arquitetura: Ferramentas e Oportunidades",
    author: "João Pereira",
    date: "05 de Junho, 2025",
    category: "Tecnologia",
    image: "https://via.placeholder.com/800x400/9370DB/FFFFFF?text=IA+Arquitetura",
    summary: "Explore como a inteligência artificial está a transformar o campo da arquitetura, desde o design generativo até a otimização de projetos.",
    content: `
      <h2>A Nova Era da Arquitetura</h2>
      <p>A inteligência artificial está a revolucionar a forma como os arquitetos concebem, projetam e executam os seus trabalhos. Esta transformação digital oferece oportunidades sem precedentes para a criatividade e eficiência.</p>
      
      <h2>Design Generativo</h2>
      <p>As ferramentas de IA podem gerar múltiplas opções de design baseadas em parâmetros específicos, permitindo aos arquitetos explorar soluções que talvez nunca tivessem considerado.</p>
      
      <h2>Otimização de Projetos</h2>
      <p>A IA pode analisar fatores como eficiência energética, custos de construção e impacto ambiental para otimizar projetos de forma automática.</p>
      
      <h2>Visualização Avançada</h2>
      <p>Tecnologias de renderização baseadas em IA permitem criar visualizações fotorrealistas em tempo real, facilitando a comunicação com clientes.</p>
    `,
    views: 2100,
    likes: 156,
    comments: 42
  },
  {
    id: "4",
    title: "Sustentabilidade em Projetos Residenciais: Um Guia Prático",
    author: "Ana Costa",
    date: "01 de Junho, 2025",
    category: "Sustentabilidade",
    image: "https://via.placeholder.com/800x400/3CB371/FFFFFF?text=Sustentabilidade",
    summary: "Aprenda a incorporar princípios de design sustentável em sua casa, reduzindo o impacto ambiental e criando espaços mais saudáveis.",
    content: `
      <h2>Por que a Sustentabilidade Importa</h2>
      <p>A construção sustentável não é apenas uma tendência, mas uma necessidade urgente para combater as mudanças climáticas e preservar recursos naturais.</p>
      
      <h2>Materiais Sustentáveis</h2>
      <p>Escolha materiais com baixo impacto ambiental, como madeira certificada, bambu, materiais reciclados e tintas com baixo VOC.</p>
      
      <h2>Eficiência Energética</h2>
      <p>Implemente soluções como isolamento térmico adequado, janelas eficientes e sistemas de aquecimento e refrigeração de alta performance.</p>
      
      <h2>Gestão da Água</h2>
      <p>Instale sistemas de captação de água da chuva, torneiras eficientes e paisagismo que requeira pouca irrigação.</p>
    `,
    views: 756,
    likes: 94,
    comments: 18
  }
];

export default function NewsDetail() {
  const [match, params] = useRoute("/news/:id");
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  
  if (!match || !params?.id) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50 py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Notícia não encontrada</h1>
            <Link href="/home/news">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar às Novidades
              </Button>
            </Link>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  const article = newsArticles.find(a => a.id === params.id);
  
  if (!article) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50 py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Notícia não encontrada</h1>
            <Link href="/home/news">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar às Novidades
              </Button>
            </Link>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? article.likes : article.likes + 1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Aqui poderia mostrar uma notificação de que o link foi copiado
    }
  };

  return (
    <ApplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Botão Voltar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link href="/home/news">
              <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar às Novidades
              </Button>
            </Link>
          </motion.div>

          {/* Artigo Principal */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden shadow-xl border-0 bg-white">
              {/* Imagem de Destaque */}
              <div className="relative">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-amber-600 text-white">
                    <Tag className="w-3 h-3 mr-1" />
                    {article.category}
                  </Badge>
                </div>
              </div>

              <CardHeader className="p-8">
                <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </CardTitle>
                
                <CardDescription className="text-lg text-gray-600 mb-6">
                  {article.summary}
                </CardDescription>

                {/* Metadados do Artigo */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Por {article.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{article.views} visualizações</span>
                  </div>
                </div>

                {/* Botões de Interação */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`flex items-center gap-2 ${
                      isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likes || article.likes}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{article.comments}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-500 hover:text-green-500"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partilhar</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0">
                {/* Conteúdo do Artigo */}
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-amber-600 prose-a:hover:text-amber-700"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </CardContent>
            </Card>
          </motion.article>

          {/* Artigos Relacionados */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Artigos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsArticles
                .filter(a => a.id !== article.id && a.category === article.category)
                .slice(0, 3)
                .map((relatedArticle) => (
                  <Card key={relatedArticle.id} className="overflow-hidden shadow-lg border-0 bg-white hover:shadow-xl transition-shadow">
                    <img 
                      src={relatedArticle.image} 
                      alt={relatedArticle.title} 
                      className="w-full h-32 object-cover"
                    />
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        <Link href={`/news/${relatedArticle.id}`} className="hover:text-amber-600 transition-colors">
                          {relatedArticle.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {relatedArticle.summary.substring(0, 100)}...
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </motion.section>
        </div>
      </div>
    </ApplicationLayout>
  );
}


