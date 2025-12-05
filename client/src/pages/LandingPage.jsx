import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import YourRights from '../components/landing/YourRights';
import Confidentiality from '../components/landing/Confidentiality';
import ForICMembers from '../components/landing/ForICMembers';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <YourRights />
      <Confidentiality />
      <ForICMembers />
      <Footer />
    </div>
  );
}
