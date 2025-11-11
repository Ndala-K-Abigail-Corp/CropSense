import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">CropSense</span>
            </div>
            <p className="text-sm text-text-secondary">
              AI-powered agricultural guidance for better farming decisions.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-it-works" className="text-text-secondary hover:text-primary">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-text-secondary hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-text-secondary hover:text-primary">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/docs" className="text-text-secondary hover:text-primary">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-text-secondary hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-text-secondary hover:text-primary">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-text-secondary hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-text-secondary hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-neutral-200 text-center text-sm text-text-secondary">
          <p>
            © {currentYear} CropSense. All rights reserved. • Answers are advisory only. Consult
            local agricultural experts for specific guidance.
          </p>
        </div>
      </div>
    </footer>
  );
}

