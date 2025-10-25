import { Heart, Mail, Phone, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative py-12 md:py-16 text-amber-100 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 overflow-hidden">
      <div className="pointer-events-none absolute -inset-32 bg-gradient-to-br from-purple-500/5 via-amber-400/5 to-purple-500/5 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 md:gap-10 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-400" />
              Emmanuel & Martha
            </h3>
            <p className="text-amber-300 text-sm md:text-base">
              Join us in celebrating our love and commitment as we begin our journey together.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 md:mb-4 text-amber-100">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="#contribute" className="text-amber-300 hover:text-amber-100 transition-colors hover:underline underline-offset-4">
                  Contribute
                </a>
              </li>
              <li>
                <a href="#pledge" className="text-amber-300 hover:text-amber-100 transition-colors hover:underline underline-offset-4">
                  Make a Pledge
                </a>
              </li>
              <li>
                <a href="#meetings" className="text-amber-300 hover:text-amber-100 transition-colors hover:underline underline-offset-4">
                  Meetings
                </a>
              </li>
              <li>
                <a href="#guestbook" className="text-amber-300 hover:text-amber-100 transition-colors hover:underline underline-offset-4">
                  Guest Book
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 md:mb-4 text-amber-100">Contact</h3>
            <div className="space-y-3">
              <a href="mailto:sebenock027@example.com" className="flex items-center gap-2 text-amber-300 hover:text-amber-100 transition-colors">
                <Mail className="w-5 h-5 text-amber-400" />
                <span className="text-sm md:text-base">sebenock027@gmail.com</span>
              </a>
              <a href="tel:+256783676313" className="flex items-center gap-2 text-amber-300 hover:text-amber-100 transition-colors">
                <Phone className="w-5 h-5 text-amber-400" />
                <span className="text-sm md:text-base">+256 783 676 313</span>
              </a>
              <a href="https://chat.whatsapp.com/FdZrxOZFq8Y6ahLcgebRjW?mode=ems_copy_t" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-amber-300 hover:text-amber-100 transition-colors">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <span className="text-sm md:text-base">Join our WhatsApp group</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-4">
          <div className="h-px w-12 md:w-24 bg-amber-400/20" />
          <Heart className="w-4 h-4 text-amber-400" />
          <div className="h-px w-12 md:w-24 bg-amber-400/20" />
        </div>

        <div className="mt-6 md:mt-8 border-t border-amber-400/10 pt-6 text-center text-amber-300">
          <p className="text-sm md:text-base">&copy; {new Date().getFullYear()} Emmanuel & Martha. All rights reserved.</p>
          <p className="mt-2 text-xs md:text-sm text-amber-400">Made with love for our special day</p>
        </div>
      </div>
    </footer>
  );
}