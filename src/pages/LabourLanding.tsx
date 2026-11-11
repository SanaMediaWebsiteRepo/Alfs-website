import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LabourLanding() {
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalContent = viewportMeta 
      ? viewportMeta.getAttribute('content') 
      : 'width=device-width, initial-scale=1.0';
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }

    return () => {
      if (viewportMeta && originalContent) {
        viewportMeta.setAttribute('content', originalContent);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F7] selection:bg-[#C41E3A]/10 selection:text-[#C41E3A] pb-10 md:pb-16 lg:pb-20">
      {/* Header Back Bar */}
      <div className="bg-[#1B2A4A] text-white py-4 px-4 md:px-12 flex justify-between items-center shadow-md">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="text-[#C41E3A]" />
          <span>Back to General Supply</span>
        </Link>
        <span className="text-sm md:text-base font-extrabold tracking-tight uppercase text-white select-none">
          ALFS <span className="text-[#C41E3A]">LABOUR</span>
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-10 lg:pt-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-4 md:mb-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 uppercase leading-[1.1] sm:leading-none mb-2 sm:mb-4">
            Zambia's Labour Force, <br className="hidden sm:inline" />
            <span className="text-[#C41E3A]">Connected.</span>
          </h1>
          <p className="text-slate-600 font-medium text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed mt-1 sm:mt-2">
            Achilles Labour-Force Services (ALFS) bridges the gap between top-tier industry players and the nation's most dedicated skilled employees.
          </p>
        </div>

        {/* Problem/Solution Compact Modules */}
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
          
          {/* Card 1: Employer */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="border border-slate-100 border-l-4 border-l-[#C41E3A] bg-white p-4 sm:p-6 rounded-xl shadow-xs relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
              Struggling to find reliable skilled employees for your business?
            </h3>
            <p className="text-slate-650 font-normal text-xs sm:text-sm mt-1.5 leading-relaxed">
              ALFS connects you directly with qualified, available employees. Access pre-vetted tradesmen, heavy machinery operators, and corporate personnel with zero paperwork delays.
            </p>
          </motion.div>

          {/* Card 2: Seeker */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="border border-slate-100 border-l-4 border-l-[#1B2A4A] bg-white p-4 sm:p-6 rounded-xl shadow-xs relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
              Can't find work that matches your skills?
            </h3>
            <p className="text-slate-650 font-normal text-xs sm:text-sm mt-1.5 leading-relaxed">
              Build your profile and get discovered by premium employers looking for exactly what you offer. Specify your industry region and let opportunities come directly to you.
            </p>
          </motion.div>

        </div>

        {/* CTA Section */}
        <div className="pt-2 md:pt-4 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            <Link
              to="/labour/join"
              className="bg-[#C41E3A] hover:bg-[#A9172F] text-white py-3 px-5 rounded-md font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-between w-full"
            >
              <span>Find Work</span>
              <ChevronRight size={16} className="shrink-0 ml-2" />
            </Link>
            <Link
              to="/labour/auth?mode=register&role=employer"
              className="bg-[#1B2A4A] hover:bg-[#131b2c] text-white py-3 px-5 rounded-md font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-between w-full"
            >
              <span>Find Employees</span>
              <ChevronRight size={16} className="shrink-0 ml-2" />
            </Link>
          </div>
          <div className="mt-4 md:mt-5 text-center">
            <Link 
              to="/labour/auth?mode=login" 
              className="group text-sm text-slate-500 font-medium transition-all"
            >
              Already have an account?{' '}
              <span className="text-[#C41E3A] font-bold group-hover:underline">
                Sign in here
              </span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
