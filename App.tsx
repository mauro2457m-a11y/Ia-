import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Sparkles, CheckCircle, ChevronRight, Download, RefreshCcw, Loader2, PenTool, LayoutTemplate, Printer } from 'lucide-react';
import { generateBookPlan, generateBookCover, generateChapterContent } from './services/geminiService';
import { AppState, BookPlan, ChapterContent } from './types';
import { BookCover } from './components/BookCover';
import { MarkdownRenderer } from './components/MarkdownRenderer';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [topic, setTopic] = useState('');
  const [plan, setPlan] = useState<BookPlan | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [generatedChapters, setGeneratedChapters] = useState<ChapterContent[]>([]);
  const [currentViewChapter, setCurrentViewChapter] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleGeneratePlan = async () => {
    if (!topic) return;
    setAppState(AppState.PLANNING);
    setError(null);
    try {
      const bookPlan = await generateBookPlan(topic);
      setPlan(bookPlan);
      setAppState(AppState.REVIEW);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar o plano.");
      setAppState(AppState.IDLE);
    }
  };

  const startFullGeneration = async () => {
    if (!plan) return;
    setAppState(AppState.GENERATING);
    setGeneratedChapters([]);
    setError(null);

    // 1. Generate Cover (Async, don't block UI too much)
    generateBookCover(plan.coverVisualPrompt)
      .then(url => setCoverImage(url))
      .catch(e => console.error("Cover failed", e));

    // 2. Generate Chapters Sequentially
    const chaptersData: ChapterContent[] = plan.chapters.map((c, i) => ({
      index: i,
      title: c.title,
      content: '',
      isGenerating: true,
      isComplete: false
    }));
    setGeneratedChapters(chaptersData);

    // Process one by one
    for (let i = 0; i < plan.chapters.length; i++) {
      try {
        const content = await generateChapterContent(plan.title, plan.chapters[i], i);
        
        setGeneratedChapters(prev => prev.map(c => 
          c.index === i ? { ...c, content, isGenerating: false, isComplete: true } : c
        ));
      } catch (err) {
        console.error(`Failed chapter ${i}`, err);
        setGeneratedChapters(prev => prev.map(c => 
            c.index === i ? { ...c, content: "Erro ao gerar este capítulo. Tente novamente.", isGenerating: false, isComplete: true } : c
          ));
      }
    }

    setAppState(AppState.FINISHED);
  };

  const handlePrint = () => {
    window.print();
  };

  // Render Helpers
  const renderProgressBar = () => {
    const completed = generatedChapters.filter(c => c.isComplete).length;
    const total = 10;
    const progress = (completed / total) * 100;
    
    return (
      <div className="w-full bg-slate-800 rounded-full h-2.5 mb-6">
        <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
        <div className="text-xs text-slate-400 mt-2 text-right">
            Gerando Capítulo {Math.min(completed + 1, 10)} de 10...
        </div>
      </div>
    );
  };

  // Scroll to top when viewing new chapter
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [currentViewChapter, appState]);


  // VIEW: LANDING
  if (appState === AppState.IDLE) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
        
        <div className="relative z-10 max-w-2xl w-full text-center space-y-8 p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2">
            AI eBook <span className="text-indigo-400">Publisher</span>
          </h1>
          <p className="text-xl text-slate-300">
            Transforme uma ideia em um infoproduto completo e lucrativo em minutos. 
            Crie um livro de 10 capítulos pronto para venda.
          </p>

          <div className="bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl mt-8">
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Sobre o que é o seu livro? (ex: Dieta Low Carb, Marketing Digital...)"
                className="flex-1 bg-transparent text-white placeholder-slate-400 px-6 py-4 rounded-lg focus:outline-none focus:bg-white/5 transition-colors text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlan()}
              />
              <button 
                onClick={handleGeneratePlan}
                disabled={!topic}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-900/50"
              >
                <Sparkles className="w-5 h-5" />
                Criar Projeto
              </button>
            </div>
          </div>
          
          {error && (
             <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200">
               {error}
             </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW: PLANNING LOADER
  if (appState === AppState.PLANNING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-semibold">Estruturando seu Best-Seller...</h2>
        <p className="text-slate-400 mt-2">Nossa IA está criando títulos, capítulos e estratégias de venda.</p>
      </div>
    );
  }

  // VIEW: REVIEW PLAN
  if (appState === AppState.REVIEW && plan) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 sticky top-0 z-50">
           <div className="max-w-6xl mx-auto flex justify-between items-center">
             <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
                <LayoutTemplate className="w-5 h-5" />
                Plano do Projeto
             </div>
             <button onClick={() => setAppState(AppState.IDLE)} className="text-slate-400 hover:text-white text-sm">
               Cancelar
             </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left: Details */}
            <div className="space-y-8">
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Título Sugerido</label>
                <h1 className="text-4xl font-serif font-bold text-white leading-tight">{plan.title}</h1>
                <h2 className="text-xl text-indigo-300 mt-2">{plan.subtitle}</h2>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Copy de Vendas</label>
                <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 italic text-slate-300 leading-relaxed">
                  "{plan.salesDescription}"
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Conceito da Capa</label>
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800 text-sm text-slate-400">
                  <PenTool className="w-4 h-4 inline mr-2" />
                  {plan.coverVisualPrompt}
                </div>
              </div>
            </div>

            {/* Right: Chapters */}
            <div className="bg-slate-800/20 rounded-2xl border border-slate-800 p-8">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-indigo-500" />
                 Estrutura do Conteúdo (10 Capítulos)
               </h3>
               <div className="space-y-4">
                 {plan.chapters.map((chapter, idx) => (
                   <div key={idx} className="flex gap-4 p-3 hover:bg-slate-800 rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">{chapter.title}</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{chapter.outline}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </main>

        <footer className="border-t border-slate-800 bg-slate-900 p-6">
          <div className="max-w-6xl mx-auto flex justify-end">
            <button 
              onClick={startFullGeneration}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-green-900/20 flex items-center gap-3 transition-all transform hover:-translate-y-1"
            >
              <CheckCircle className="w-5 h-5" />
              Aprovar & Gerar Ebook Completo
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // VIEW: GENERATING / READING
  const isGenerating = appState === AppState.GENERATING;
  const isFinished = appState === AppState.FINISHED;

  if (isGenerating || isFinished) {
    const currentChapterData = generatedChapters[currentViewChapter];
    const isChapterReady = currentChapterData?.isComplete;

    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden print-container">
        
        {/* Sidebar Navigation */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col no-print">
          <div className="p-6 border-b border-slate-800">
             <h1 className="font-serif font-bold text-lg leading-tight mb-1">{plan?.title}</h1>
             <span className="text-xs text-indigo-400 uppercase tracking-wider font-semibold">Painel de Controle</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            <button
               onClick={() => setCurrentViewChapter(-1)}
               className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all ${currentViewChapter === -1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <span className="font-medium text-sm">Capa & Introdução</span>
            </button>

            {generatedChapters.map((chapter) => (
              <button
                key={chapter.index}
                onClick={() => setCurrentViewChapter(chapter.index)}
                disabled={!chapter.isComplete && !chapter.isGenerating}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all 
                  ${currentViewChapter === chapter.index ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}
                  ${!chapter.isComplete && !chapter.isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex flex-col">
                  <span className="text-xs opacity-70 mb-0.5">Capítulo {chapter.index + 1}</span>
                  <span className="font-medium text-sm truncate w-48">{chapter.title}</span>
                </div>
                {chapter.isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                ) : chapter.isComplete ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                   <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900">
             {isGenerating && renderProgressBar()}
             {isFinished && (
               <button 
                onClick={handlePrint}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
               >
                 <Download className="w-4 h-4" />
                 Exportar PDF / Imprimir
               </button>
             )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-100 print:bg-white print:text-black">
          {/* Header Actions (No Print) */}
          <header className="absolute top-4 right-8 z-20 flex gap-2 no-print">
            {isGenerating && (
                 <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase flex items-center gap-2 shadow-sm border border-indigo-200">
                   <Loader2 className="w-3 h-3 animate-spin" />
                   Gerando conteúdo em tempo real...
                 </span>
            )}
            {isFinished && (
                <button onClick={handlePrint} className="bg-slate-900 text-white p-2 rounded-full shadow hover:scale-105 transition-transform print:hidden">
                    <Printer className="w-5 h-5" />
                </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-8 md:p-16 print:p-0 print:overflow-visible">
            
            {/* Cover View */}
            {currentViewChapter === -1 && plan && (
               <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full py-10 print:h-screen print:justify-center">
                  <BookCover 
                    title={plan.title} 
                    subtitle={plan.subtitle} 
                    imageUrl={coverImage || undefined}
                    loading={isGenerating && !coverImage}
                  />
                  
                  <div className="mt-16 text-center max-w-2xl print:hidden">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">Sobre este livro</h3>
                    <p className="text-slate-700 text-lg leading-relaxed font-serif">
                      {plan.salesDescription}
                    </p>
                  </div>

                  {/* Print only metadata page */}
                  <div className="hidden print:block mt-96 text-center">
                    <p className="text-sm text-gray-500">Gerado por eBook AI Publisher</p>
                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                  </div>
               </div>
            )}

            {/* Chapter Content View */}
            {currentViewChapter >= 0 && (
              <div className="max-w-3xl mx-auto bg-white min-h-[80vh] shadow-xl p-12 md:p-20 rounded-sm print:shadow-none print:p-0 print:min-h-0">
                 {currentChapterData?.isGenerating ? (
                   <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                      <p className="text-slate-500 font-medium">Escrevendo o Capítulo {currentChapterData.index + 1}...</p>
                   </div>
                 ) : (
                   <article className="print:break-before-page">
                      <header className="mb-12 text-center border-b-2 border-slate-100 pb-8">
                        <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm block mb-3">
                          Capítulo {currentChapterData?.index + 1}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900">
                          {currentChapterData?.title}
                        </h1>
                      </header>
                      
                      <MarkdownRenderer content={currentChapterData?.content || ''} />
                      
                      <div className="mt-16 pt-8 border-t border-slate-100 flex justify-center text-slate-400 no-print">
                        <span className="text-2xl">***</span>
                      </div>
                   </article>
                 )}
              </div>
            )}
            
            {/* For Print: Loop all chapters that are ready if we wanted to print all at once. 
                However, usually users view one by one. 
                To make it "Ready for Sale", we should enable printing the WHOLE book.
                Below block is ONLY visible during print.
            */}
            <div className="hidden print:block">
                 {generatedChapters.map((chap) => (
                    chap.index !== currentViewChapter && chap.isComplete && (
                        <div key={chap.index} className="break-before-page py-12">
                             <header className="mb-12 text-center border-b-2 border-slate-100 pb-8">
                                <span className="text-gray-600 font-bold uppercase tracking-widest text-sm block mb-3">
                                  Capítulo {chap.index + 1}
                                </span>
                                <h1 className="text-4xl font-serif font-bold text-black">
                                  {chap.title}
                                </h1>
                              </header>
                              <MarkdownRenderer content={chap.content} />
                        </div>
                    )
                 ))}
            </div>

          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default App;
