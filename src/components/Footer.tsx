import { Heart, Mail, Phone, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative py-12 md:py-14 text-white bg-gradient-to-br from-gray-900 via-gray-900 to-black overflow-hidden">
      <div className="pointer-events-none absolute -inset-32 bg-gradient-to-br from-rose-500/5 via-fuchsia-500/5 to-purple-500/5 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 md:gap-10 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              Emmanuel & Martha
            </h3>
            <p className="text-gray-400 text-sm md:text-base">
              Join us in celebrating our love and commitment as we begin our journey together.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 md:mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="#contribute" className="text-gray-400 hover:text-white transition-colors hover:underline underline-offset-4">
                  Contribute
                </a>
              </li>
              <li>
                <a href="#pledge" className="text-gray-400 hover:text-white transition-colors hover:underline underline-offset-4">
                  Make a Pledge
                </a>
              </li>
              <li>
                <a href="#meetings" className="text-gray-400 hover:text-white transition-colors hover:underline underline-offset-4">
                  Meetings
                </a>
              </li>
              <li>
                <a href="#guestbook" className="text-gray-400 hover:text-white transition-colors hover:underline underline-offset-4">
                  Guest Book
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 md:mb-4">Contact</h3>
            <div className="space-y-3">
              <a href="mailto:sebenock027@example.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                <span className="text-sm md:text-base">sebenock027@gmail.com</span>
              </a>
              <a href="tel:+256783676313" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
                <span className="text-sm md:text-base">+256 783 676 313</span>
              </a>
              <a href="https://chat.whatsapp.com/FdZrxOZFq8Y6ahLcgebRjW?mode=ems_copy_t" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm md:text-base">Join our WhatsApp group</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-4">
          <div className="h-px w-12 md:w-24 bg-white/10" />
          <Heart className="w-4 h-4 text-rose-400" />
          <div className="h-px w-12 md:w-24 bg-white/10" />
        </div>

        <div className="mt-6 md:mt-8 border-t border-white/10 pt-6 text-center text-gray-400">
          <p className="text-sm md:text-base">&copy; {new Date().getFullYear()} Emmanuel & Martha. All rights reserved.</p>
          <p className="mt-2 text-xs md:text-sm">Made with love for our special day</p>
        </div>
      </div>
    </footer>
  );
}