import { Heart, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              John & Priscilla
            </h3>
            <p className="text-gray-400">
              Join us in celebrating our love and commitment as we begin our journey together.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#contribute" className="text-gray-400 hover:text-rose-400 transition-colors">
                  Contribute
                </a>
              </li>
              <li>
                <a href="#pledge" className="text-gray-400 hover:text-rose-400 transition-colors">
                  Make a Pledge
                </a>
              </li>
              <li>
                <a href="#meetings" className="text-gray-400 hover:text-rose-400 transition-colors">
                  Meetings
                </a>
              </li>
              <li>
                <a href="#guestbook" className="text-gray-400 hover:text-rose-400 transition-colors">
                  Guest Book
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <div className="space-y-3">
              <a href="mailto:sebenock027@example.com" className="flex items-center gap-2 text-gray-400 hover:text-rose-400 transition-colors">
                <Mail className="w-5 h-5" />
                sebenock027@gmail.com
              </a>
              <a href="tel:+256783676313" className="flex items-center gap-2 text-gray-400 hover:text-rose-400 transition-colors">
                <Phone className="w-5 h-5" />
                +256 783 676 313
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} John & Priscilla. All rights reserved.</p>
          <p className="mt-2 text-sm">Made with love for our special day</p>
        </div>
      </div>
    </footer>
  );
}
