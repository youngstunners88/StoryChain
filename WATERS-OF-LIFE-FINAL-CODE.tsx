import { Phone, Instagram, Facebook, MapPin, Clock, ChevronDown, Mail, Calendar, Utensils, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export default function WatersOfLife() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Waters Of Life | mind body soil";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-600">Waters Of Life</span>
            <span className="text-sm text-gray-500 hidden sm:inline">mind • body • soil</span>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#about" className="text-gray-700 hover:text-amber-600 transition-colors">About</a>
            <a href="#menu" className="text-gray-700 hover:text-amber-600 transition-colors">Menu</a>
            <a href="#gallery" className="text-gray-700 hover:text-amber-600 transition-colors">Gallery</a>
            <a href="#events" className="text-gray-700 hover:text-amber-600 transition-colors">Events</a>
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
            <a href="#events" className="block px-4 py-3 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Events</a>
            <a href="#contact" className="block px-4 py-3 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Contact</a>
          </div>
        )}
      </nav>

      {/* Hero Section - Image 8: Logo + Image 2: Food collage background */}
      <header className="pt-20 relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-orange-500/90 z-10"></div>
        <img 
          src="/watersoflife/food-maboneng.jpg" 
          alt="Waters Of Life Food" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center text-white px-4">
          <img src="/watersoflife/logo.jpg" alt="Logo" className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white shadow-xl" />
          <h1 className="text-5xl md:text-7xl font-bold mb-4">Waters Of Life</h1>
          <p className="text-2xl md:text-3xl mb-2">mind • body • soil</p>
          <p className="text-lg opacity-90 mb-8">Authentic South African Street Food</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#menu" className="bg-white text-amber-600 px-8 py-3 rounded-full font-semibold hover:bg-amber-100 transition-colors">
              View Menu
            </a>
            <a href="tel:0719400506" className="bg-amber-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-900 transition-colors">
              Order Now
            </a>
          </div>
        </div>
      </header>

      {/* About Section - Image 3: Chef Ntokozo */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img 
                src="/watersoflife/chef.jpg" 
                alt="Chef Ntokozo" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Meet Chef Ntokozo</h2>
              <p className="text-gray-600 mb-4">
                Chef Ntokozo Mkhize is the heart and soul behind Waters Of Life. With a passion for authentic South African cuisine and a commitment to community, he brings flavors that nourish both body and soul.
              </p>
              <p className="text-gray-600 mb-4">
                Based in Maboneng, Johannesburg, Waters Of Life is more than just street food—it's a movement connecting people through the love of good food.
              </p>
              <p className="text-gray-600 mb-6">
                From the Meatless Monday initiative to community events, Chef Ntokozo believes in making a positive impact through every dish served.
              </p>
              <div className="flex gap-4">
                <div className="bg-amber-100 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">Since</p>
                  <p className="text-gray-700">2005</p>
                </div>
                <div className="bg-amber-100 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">Location</p>
                  <p className="text-gray-700">Maboneng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Section - Image 5: Banner */}
      <section className="py-20 px-4 bg-gradient-to-br from-amber-600 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">mind • body • soil</h2>
              <p className="text-xl mb-4">
                Our philosophy is simple: food that nourishes the mind, body, and the soil we all depend on.
              </p>
              <p className="text-lg opacity-90">
                We believe in sustainable practices, community engagement, and serving food that makes you feel good inside and out.
              </p>
            </div>
            <div className="relative">
              <img 
                src="/watersoflife/banner.jpg" 
                alt="Waters Of Life Banner" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - Image 7: Menu poster */}
      <section id="menu" className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Our Menu</h2>
          <p className="text-xl mb-8 opacity-90">Fresh, authentic, and made with love</p>
          
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-lg mx-auto">
            <img 
              src="/watersoflife/menu.jpg" 
              alt="Waters Of Life Menu" 
              className="w-full rounded-xl"
            />
          </div>
          
          <p className="mt-8 text-lg">
            <Phone className="inline w-5 h-5 mr-2" />
            For deliveries and orders: <a href="tel:0719400506" className="underline font-bold">071 940 0506</a>
          </p>
        </div>
      </section>

      {/* App Menu Section - Image 6: App menu screenshot */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-pink-500 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Order on the Go</h2>
          <p className="text-xl mb-8 opacity-90">Our mobile app makes ordering easy</p>
          
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
            <img 
              src="/watersoflife/app-menu.jpg" 
              alt="Mobile App Menu" 
              className="w-full rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Gallery Section - Image 4: Community + Image 1: FAO booth */}
      <section id="gallery" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Our Story</h2>
          <p className="text-center text-gray-600 mb-12">Community, recognition, and great food</p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="relative group overflow-hidden rounded-2xl">
              <img src="/watersoflife/community.jpg" alt="Community Event" className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-xl">Community Engagement</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-2xl">
              <img src="/watersoflife/fao-booth.jpg" alt="FAO Recognition" className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-xl">FAO Recognition - Meatless Monday</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section - Image 9: Event poster */}
      <section id="events" className="py-20 px-4 bg-gradient-to-br from-amber-600 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Upcoming Events</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <img 
                src="/watersoflife/event.jpg" 
                alt="Music Games & Food Event" 
                className="w-full rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-4">Music, Games & Food</h3>
              <p className="text-xl mb-4">11 September | R150 per person</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2"><Utensils className="w-5 h-5" /> Saxophone performances</li>
                <li className="flex items-center gap-2"><Heart className="w-5 h-5" /> Traditional dance</li>
                <li className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Board games, chess & cards</li>
              </ul>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="font-semibold">Schedule:</p>
                <p>11AM arrival | 12PM starters | 1PM main course</p>
              </div>
              <a href="tel:0719400506" className="inline-block mt-6 bg-white text-amber-600 px-8 py-3 rounded-full font-semibold hover:bg-amber-100 transition-colors">
                RSVP: 071 940 0506
              </a>
            </div>
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
                <div className="bg-amber-100 p-4 rounded-full">
                  <Phone className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500">Phone / WhatsApp</p>
                  <a href="tel:0719400506" className="text-xl font-bold text-gray-800 hover:text-amber-600">071 940 0506</a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="text-xl font-bold text-gray-800">Maboneng, Johannesburg</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <Instagram className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500">Instagram</p>
                  <a href="https://instagram.com/watersoflife_streetfood" target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-gray-800 hover:text-amber-600">@watersoflife_streetfood</a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <Facebook className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500">Facebook</p>
                  <a href="https://facebook.com/watersoflife" target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-gray-800 hover:text-amber-600">@watersoflife</a>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Order Now</h3>
              <p className="text-gray-600 mb-6">
                Call or WhatsApp Chef Ntokozo for deliveries and catering services.
              </p>
              <a 
                href="https://wa.me/27719400506" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-green-500 text-white text-center py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                WhatsApp Us
              </a>
              <a 
                href="tel:0719400506" 
                className="block w-full bg-amber-600 text-white text-center py-4 rounded-xl font-semibold hover:bg-amber-700 transition-colors mt-4"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-2">Waters Of Life</h3>
          <p className="text-amber-400 mb-4">mind • body • soil</p>
          <div className="flex justify-center gap-6 mb-8">
            <a href="https://instagram.com/watersoflife_streetfood" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-purple-600 to-pink-500 text-white p-3 rounded-full hover:scale-110 transition-transform">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="https://facebook.com/watersoflife" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white p-3 rounded-full hover:scale-110 transition-transform">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="https://wa.me/27719400506" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white p-3 rounded-full hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </a>
          </div>
          <p className="text-gray-400">© 2024 Waters Of Life. All rights reserved.</p>
          <p className="text-gray-500 mt-2">Authentic South African Street Food</p>
        </div>
      </footer>
    </div>
  );
}
