import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ backgroundColor: 'var(--cs-primary)' }}
              >
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span 
                className="text-xl font-bold"
                style={{ color: 'var(--cs-text)' }}
              >
                CropSense
              </span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              AI-powered agricultural guidance for better farming decisions.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 
              className="font-semibold mb-4 text-sm uppercase tracking-wider"
              style={{ color: 'var(--cs-text)' }}
            >
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/how-it-works" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link 
                  to="/features" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 
              className="font-semibold mb-4 text-sm uppercase tracking-wider"
              style={{ color: 'var(--cs-text)' }}
            >
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/docs" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 
              className="font-semibold mb-4 text-sm uppercase tracking-wider"
              style={{ color: 'var(--cs-text)' }}
            >
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-neutral-600 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-600">
            <p>
              © {currentYear} CropSense. All rights reserved.
            </p>
            <p className="text-center text-xs md:text-sm">
              Answers are advisory only. Consult local agricultural experts for specific guidance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

