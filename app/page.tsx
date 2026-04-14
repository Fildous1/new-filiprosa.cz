import Navigation from '@/components/Navigation'
import HashScroll from '@/components/HashScroll'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import FeaturedPhotos from '@/components/FeaturedPhotos'
import Projects from '@/components/Projects'
import About from '@/components/About'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import BottomBlur from '@/components/BottomBlur'

export default function Home() {
  return (
    <>
      <HashScroll />
      <BottomBlur />
      <Navigation />
      <Hero />
      <div className="film-strip" />
      <Services />
      <div className="film-strip" />
      <FeaturedPhotos />
      <div className="film-strip" />
      <Projects />
      <div className="film-strip" />
      <About />
      <div className="film-strip" />
      <Contact />
      <Footer />
    </>
  )
}
