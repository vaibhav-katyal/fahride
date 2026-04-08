import { Zap, Wrench, MessageSquare } from "lucide-react";

export default function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="text-center space-y-8">
          {/* Logo icon with animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-2xl animate-pulse" />
              <div className="h-20 w-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                <Wrench className="h-10 w-10 text-white animate-spin" style={{ animationDuration: "3s" }} />
              </div>
            </div>
          </div>

          {/* Main heading */}
          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
              We're Curating <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-400 bg-clip-text text-transparent">
                Things For You
              </span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-200/80 max-w-lg mx-auto leading-relaxed">
              Our platform is under maintenance to bring you amazing improvements to your FahRide experience.
            </p>
          </div>

          {/* Info boxes */}
          <div className="grid md:grid-cols-2 gap-4 py-8">
            {/* Status box */}
            <div className="bg-white/5 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 space-y-3 hover:border-emerald-500/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="font-semibold text-white">We'll be back soon</p>
              </div>
              <p className="text-sm text-emerald-100/70">
                Thank you for your patience. We're working hard to make FahRide even better!
              </p>
            </div>

            {/* Support box */}
            <div className="bg-white/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6 space-y-3 hover:border-blue-500/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <p className="font-semibold text-white">Need help?</p>
              </div>
              <p className="text-sm text-blue-100/70 mb-3">
                For urgent assistance, reach out to us on WhatsApp or email.
              </p>
              <a
                href="https://chat.whatsapp.com/HzdNLw7gkhbCEpszycId8o"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300"
              >
                Join Our Community 💬
              </a>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-emerald-200/60 text-sm pt-4">
            FahRide • Quality is our priority
          </p>
        </div>
      </div>

      {/* Custom animations in style tag */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
