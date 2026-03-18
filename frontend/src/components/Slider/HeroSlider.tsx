import { useState, useEffect, useCallback } from 'react'
import { Slider } from '../../types/slider'

interface HeroSliderProps {
  sliders: Slider[]
  autoPlayInterval?: number
}

export default function HeroSlider({ sliders, autoPlayInterval = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrent(index)
      setIsTransitioning(false)
    }, 300)
  }, [isTransitioning])

  const next = useCallback(() => {
    goTo((current + 1) % sliders.length)
  }, [current, sliders.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + sliders.length) % sliders.length)
  }, [current, sliders.length, goTo])

  useEffect(() => {
    if (sliders.length <= 1) return
    const timer = setInterval(next, autoPlayInterval)
    return () => clearInterval(timer)
  }, [next, autoPlayInterval, sliders.length])

  if (!sliders.length) return null

  const slide = sliders[current]

  return (
    <div className="relative w-full h-[75vh] overflow-hidden rounded-xl shadow-2xl">
      <div
        className={"absolute inset-0 bg-cover bg-center transition-opacity duration-300 " + (isTransitioning ? "opacity-0" : "opacity-100")}
        style={{ backgroundImage: "url(" + slide.image_url + ")" }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className={"relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-8 transition-all duration-300 " + (isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0")}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="text-lg md:text-2xl mb-8 max-w-2xl drop-shadow">
            {slide.subtitle}
          </p>
        )}
        {slide.button_text && slide.button_url && (
          <a href={slide.button_url} className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg">
            {slide.button_text}
          </a>
        )}
      </div>
      {sliders.length > 1 && (
        <div>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors backdrop-blur-sm text-xl">
            &lt;
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors backdrop-blur-sm text-xl">
            &gt;
          </button>
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {sliders.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={"w-3 h-3 rounded-full transition-all " + (i === current ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75")} />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full z-20">
        <div className="h-full bg-white transition-all ease-linear" style={{ width: ((current + 1) / sliders.length * 100) + "%" }} />
      </div>
    </div>
  )
}
