import { Phone, Instagram, Facebook, MapPin, Clock, Star, ChefHat, Users, Music, Calendar } from "lucide-react";

export default function WatersOfLife() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Hero Section */}
      <header className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img 
          src="/waters-of-life/banner.jpg" 
          alt="Waters Of Life Banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-amber-900/70" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-2">
            WATERS OF LIFE
          </h1>
          <p className="text-2xl md:text-3xl text-amber-200 font-light italic">
            mind • body • soil
          </p>
          <p className="text-xl text-white/90 mt-4">
            Authentic Street Food • Maboneng
          </p>
        </div>
      </header>

      {/* About Chef Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <img 
            src="/waters-of-life/community.jpg" 
            alt="Chef Ntokozo Mkhize" 
            className="rounded-2xl shadow-2xl w-full"
          />
          <div>
            <h2 className="text-4xl font-bold text-amber-900 mb-4">
              Chef Ntokozo Mkhize
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              A passionate culinary artist with 19 years of experience in the food industry. 
              Starting as a food handler at Vodacom Park, Chef Ntokozo has built a remarkable 
              career through dedication and skill.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              His journey includes roles at the University of the Witwatersrand, 
              Cornish Pasty Co., and running his own catering business since 2005.
            </p>
            <div className="flex gap-4 flex-wrap">
              <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-medium">
                <ChefHat className="inline w-4 h-4 mr-1" /> 19 Years Experience
              </span>
              <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-medium">
                <Users className="inline w-4 h-4 mr-1" /> Community Focused
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - ACTUAL MENU IMAGE */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-800 to-orange-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-2">OUR MENU</h2>
          <p className="text-amber-200 mb-8">Fresh • Authentic • Delicious</p>
          
          <img 
            src="/waters-of-life/menu.jpg" 
            alt="Waters Of Life Menu" 
            className="w-full max-w-2xl mx-auto rounded-2xl shadow-2xl"
          />
          
          <p className="text-white/80 mt-6">
            For deliveries, contact Chef Ntokozo: 071 940 0506
          </p>
        </div>
      </section>

      {/* Food Gallery - ALL IMAGES */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-12">
            OUR CREATIONS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <img 
              src="/waters-of-life/food.jpg" 
              alt="Delicious food" 
              className="w-full h-64 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform"
            />
            <img 
              src="/waters-of-life/food-collage.jpg" 
              alt="Food collage" 
              className="w-full h-64 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform"
            />
            <img 
              src="/waters-of-life/food1.jpg" 
              alt="Grilled dishes" 
              className="w-full h-64 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform"
            />
            <img 
              src="/waters-of-life/food2.jpg" 
              alt="Street food" 
              className="w-full h-64 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform"
            />
            <img 
              src="/waters-of-life/food3.jpg" 
              alt="Plated meals" 
              className="w-full h-64 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform"
            />
            <img 
              src="/waters-of-life/promo.jpg" 
              alt="Promotional event" 
              className="w-full h-64 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform"
            />
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-orange-600 to-red-700">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-2">
              <Music className="inline w-10 h-10 mr-2" />
              MUSIC, GAMES & FOOD
            </h2>
            <p className="text-orange-200 text-xl">An Unforgettable Experience</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 text-white">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4">
                  <Calendar className="inline w-6 h-6 mr-2" />
                  11 September
                </h3>
                <ul className="space-y-3 text-lg">
                  <li>🎷 Live Saxophone Performances</li>
                  <li>💃 Traditional Dance</li>
                  <li>🎲 Board Games, Chess & Cards</li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Schedule</h3>
                <p>⏰ Arrival: 11 AM</p>
                <p>🍽️ Starters: 12 PM</p>
                <p>🍛 Main Course: 1 PM</p>
              </div>
              
              <div className="bg-amber-500 rounded-xl p-6 text-center">
                <p className="text-3xl font-bold">R150 per person</p>
                <p className="mt-2">RSVP: Chef Ntoko 071 940 0506</p>
              </div>
            </div>
            
            <img 
              src="/waters-of-life/event.jpg" 
              alt="Event poster" 
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Community & Promo */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold text-amber-900 mb-6">Community Engagement</h2>
            <p className="text-gray-700 mb-4">
              Waters Of Life is proud to participate in community events and youth programs, 
              promoting health and wellness through food.
            </p>
            <img 
              src="/waters-of-life/community.jpg" 
              alt="Community event" 
              className="w-full rounded-xl shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-amber-900 mb-6">Our Events</h2>
            <img 
              src="/waters-of-life/promo.jpg" 
              alt="Promotional booth" 
              className="w-full rounded-xl shadow-lg mb-4"
            />
            <p className="text-gray-700">
              We bring our delicious street food to events across Johannesburg. 
              Book us for your next gathering!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-900 to-orange-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">GET IN TOUCH</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="tel:0719400506" 
              className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition"
            >
              <Phone className="w-8 h-8 mx-auto mb-3 text-amber-300" />
              <p className="text-xl font-medium">Call or WhatsApp</p>
              <p className="text-amber-200">071 940 0506</p>
            </a>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <MapPin className="w-8 h-8 mx-auto mb-3 text-amber-300" />
              <p className="text-xl font-medium">Location</p>
              <p className="text-amber-200">Maboneng, Johannesburg</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mt-8">
            <a 
              href="https://www.facebook.com/watersoflife" 
              target="_blank"
              className="bg-blue-600 p-4 rounded-full hover:bg-blue-500 transition"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a 
              href="https://www.instagram.com/explore/tags/watersoflife_streetfood/" 
              target="_blank"
              className="bg-gradient-to-br from-purple-600 to-pink-500 p-4 rounded-full hover:opacity-80 transition"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-4 text-center">
        <h3 className="text-2xl font-bold mb-2">WATERS OF LIFE</h3>
        <p className="text-amber-400 italic mb-4">mind • body • soil</p>
        <p className="text-white/60 text-sm">
          © 2024 Waters Of Life. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
