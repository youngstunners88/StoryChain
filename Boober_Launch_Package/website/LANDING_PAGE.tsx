import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import {
  MapPin,
  Navigation,
  CreditCard,
  Shield,
  Users,
  Star,
  Clock,
  Smartphone,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <Badge className="bg-[#E63946] text-white mb-6">
                Now Live in Johannesburg
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                The Future of{' '}
                <span className="text-[#E63946]">Minibus Taxis</span>{' '}
                is Here
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Hail a taxi in seconds. Track your ride in real-time. Pay with cash or card. Built for Johannesburg, by Johannesburg.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" className="bg-[#E63946] hover:bg-[#c1121f] text-white text-lg px-8 py-6">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Download Now
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center md:justify-start gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">50K+</p>
                  <p className="text-sm text-gray-500">Rides Completed</p>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">1,200+</p>
                  <p className="text-sm text-gray-500">Verified Drivers</p>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">4.8</p>
                  <p className="text-sm text-gray-500">Average Rating</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-4">
                <div className="bg-gray-900 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-gray-400 text-sm">boober.co.za</p>
                  </div>
                  <div className="relative h-80 bg-gray-700">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
                    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#E63946] rounded-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pickup</p>
                          <p className="font-medium text-gray-900">Johannesburg CBD</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Navigation className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Drop-off</p>
                          <p className="font-medium text-gray-900">Soweto</p>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-[#E63946] hover:bg-[#c1121f] text-white">
                        Find Taxi - R25
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#E63946] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Live in Gauteng
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
