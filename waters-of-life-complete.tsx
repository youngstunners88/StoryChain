import { Phone, Instagram, Facebook, MapPin, Clock, ChevronDown, Mail, Calendar, Utensils, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export default function WatersOfLife() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Waters Of Life | mind body soil";
  }, []);

  // ALL 9 IMAGES - EACH USED EXACTLY ONCE:
  // 01-fao-booth.jpg - FAO promotional booth
  // 02-food-collage.jpg - Food collage with Maboneng
  // 03-chef-children.jpg - Chef with children
  // 04-chef-bw.jpg - Chef portrait (black & white)
  // 05-banner.jpg - Waters Of Life banner
  // 06-app-menu.jpg - Mobile app menu
  // 07-menu-poster.jpg - Menu poster (ROLLS/PLATES)
  // 08-logo.jpg - Waters Of Life logo (lotus)
  // 09-event.jpg - Event poster (Music Games Food)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/watersoflife/08-logo.jpg" alt="Waters Of Life Logo" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-2xl font-bold text-amber-600">Waters Of Life</span>
            <span className="text-sm text-gray-500 hidden sm:inline">mind • body • soil</span>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#about" className="text-gray-700 hover:text-amber-600 transition-colors">About</a>
            <a href="#menu" className="text-gray-700 hover:text-amber-600 transition-colors">Menu</a>
            <a href="#gallery" className="text-gray-700 hover:text-amber-600 transition-colors">Gallery</a>
            <a href="#contact" className="text-gray-700 hover:text-amber-600 transition-colors">Contact</a>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <ChevronDown className={`w-6 h-6 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <a href="#about" className="block px-4 py-3 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#menu" className="block px-4 py-3 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Menu</a>
            <a href="#gallery" className="block px-4 py-3 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Gallery</a>
            <a href="#contact" className="block px-4 py-3 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Contact</a>
          </div>
        )}
      </nav>

      {/* Hero Section - IMAGE 02: Food collage */}
      <header className="pt-20 relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-orange-500/90 z-10"></div>
        <img src="/watersoflife/02-food-collage.jpg" alt="Waters Of Life Food" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">Waters Of Life</h1>
          <p className="text-2xl md:text-3xl mb-2">mind • body • soil</p>
          <p className="text-lg opacity-90 mb-8">Authentic South African Street Food</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#menu" className="bg-white text-amber-600 px-8 py-3 rounded-full font-semibold hover:bg-amber-100 transition-colors">View Menu</a>
            <a href="tel:0719400506" className="bg-amber-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-900 transition-colors">Order Now</a>
          </div>
        </div>
      </header>

      {/* About Section - IMAGE 05: Banner & IMAGE 04: Chef BW */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">About Waters Of Life</h2>
              <p className="text-gray-600 mb-4">Waters Of Life is a passion-driven street food business founded by Chef Ntokozo Mkhize. Based in Maboneng, Johannesburg, we serve authentic South African street food with a focus on quality, community, and sustainability.</p>
              <p className="text-gray-600 mb-6">Our "mind • body • soil" philosophy guides everything we do. From the Meatless Monday movement to community events, we're committed to making a positive impact through food.</p>
              <div className="flex gap-4">
                <div className="bg-amber-100 p-4 rounded-lg"><p className="text-2xl font-bold text-amber-600">Since</p><p className="text-gray-700">2005</p></div>
                <div className="bg-amber-100 p-4 rounded-lg"><p className="text-2xl font-bold text-amber-600">Location</p><p className="text-gray-700">Maboneng</p></div>
              </div>
            </div>
            <div className="relative">
              <img src="/watersoflife/05-banner.jpg" alt="Waters Of Life Banner" className="rounded-2xl shadow-2xl w-full" />
            </div>
          </div>
          {/* Chef Photo */}
          <div className="mt-12 grid md:grid-cols-2 gap-12 items-center">
            <img src="/watersoflife/04-chef-bw.jpg" alt="Chef Ntokozo" className="rounded-2xl shadow-2xl w-full" />
            <div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Chef Ntokozo Mkhize</h3>
              <p className="text-gray-600 mb-4">Passionate about creating delicious, healthy food that nourishes both body and soul. Chef Ntokozo brings years of culinary expertise to every dish.</p>
              <p className="text-gray-600">Contact: <a href="tel:0719400506" className="text-amber-600 font-bold">071 940 0506</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - IMAGE 07: Menu poster */}
      <section id="menu" className="py-20 px-4 bg-gradient-to-br from-amber-600 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Our Menu</h2>
          <p className="text-xl mb-8 opacity-90">Fresh, authentic, and made with love</p>
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-2xl mx-auto">
            <img src="/watersoflife/07-menu-poster.jpg" alt="Waters Of Life Menu" className="w-full rounded-xl" />
          </div>
          <p className="mt-8 text-lg"><Phone className="inline w-5 h-5 mr-2" />For deliveries: <a href="tel:0719400506" className="underline font-bold">071 940 0506</a></p>
        </div>
      </section>

      {/* Gallery Section - REMAINING IMAGES: 01, 03, 06 */}
      <section id="gallery" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Gallery</h2>
          <p className="text-center text-gray-600 mb-12">Our food, our events, our community</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* IMAGE 01: FAO Booth */}
            <div className="relative group overflow-hidden rounded-xl aspect-square">
              <img src="/watersoflife/01-fao-booth.jpg" alt="FAO Event" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"><span className="text-white font-semibold">FAO Partnership</span></div>
            </div>
            {/* IMAGE 03: Chef with children */}
            <div className="relative group overflow-hidden rounded-xl aspect-square">
              <img src="/watersoflife/03-chef-children.jpg" alt="Community Event" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"><span className="text-white font-semibold">Community</span></div>
            </div>
            {/* IMAGE 06: App Menu */}
            <div className="relative group overflow-hidden rounded-xl aspect-square">
              <img src="/watersoflife/06-app-menu.jpg" alt="Mobile App Menu" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"><span className="text-white font-semibold">Our Menu</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section - IMAGE 09: Event poster */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-pink-500 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Upcoming Events</h2>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
            <img src="/watersoflife/09-event.jpg" alt="Music Games & Food Event" className="w-full rounded-xl mb-6" />
            <a href="tel:0719400506" className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-100 transition-colors">RSVP: 071 940 0506</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Contact Us</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full"><Phone className="w-6 h-6 text-amber-600" /></div>
                <div><p className="text-gray-500">Phone / WhatsApp</p><a href="tel:0719400506" className="text-xl font-bold text-gray-800 hover:text-amber-600">071 940 0506</a></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full"><MapPin className="w-6 h-6 text-amber-600" /></div>
                <div><p className="text-gray-500">Location</p><p className="text-xl font-bold text-gray-800">Maboneng, Johannesburg</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full"><Instagram className="w-6 h-6 text-amber-600" /></div>
                <div><p className="text-gray-500">Instagram</p><a href="https://instagram.com/watersoflife_streetfood" target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-gray-800 hover:text-amber-600">@watersoflife_streetfood</a></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full"><Facebook className="w-6 h-6 text-amber-600" /></div>
                <div><p className="text-gray-500">Facebook</p><a href="https://facebook.com/watersoflife" target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-gray-800 hover:text-amber-600">@watersoflife</a></div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Order Now</h3>
              <p className="text-gray-600 mb-6">Call or WhatsApp Chef Ntokozo for deliveries and catering.</p>
              <a href="https://wa.me/27719400506" target="_blank" rel="noopener noreferrer" className="block w-full bg-green-500 text-white text-center py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors">WhatsApp Us</a>
              <a href="tel:0719400506" className="block w-full bg-amber-600 text-white text-center py-4 rounded-xl font-semibold hover:bg-amber-700 transition-colors mt-4">Call Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <img src="/watersoflife/08-logo.jpg" alt="Waters Of Life Logo" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
          <h3 className="text-3xl font-bold mb-2">Waters Of Life</h3>
          <p className="text-amber-400 mb-4">mind • body • soil</p>
          <div className="flex justify-center gap-6 mb-8">
            <a href="https://instagram.com/watersoflife_streetfood" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-purple-600 to-pink-500 text-white p-3 rounded-full hover:scale-110 transition-transform"><Instagram className="w-6 h-6" /></a>
            <a href="https://facebook.com/watersoflife" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white p-3 rounded-full hover:scale-110 transition-transform"><Facebook className="w-6 h-6" /></a>
            <a href="https://wa.me/27719400506" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white p-3 rounded-full hover:scale-110 transition-transform"><Phone className="w-6 h-6" /></a>
          </div>
          <p className="text-gray-400">© 2024 Waters Of Life. All rights reserved.</p>
          <p className="text-gray-500 mt-2">Authentic South African Street Food</p>
        </div>
      </footer>
    </div>
  );
}
