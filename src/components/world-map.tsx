'use client'

import { useEffect, useState } from 'react'

interface Country {
  id: string
  name: string
  code: string
  continent: string
  position: [number, number, number]
  color: string
}

interface WorldMapProps {
  onCountrySelect: (country: Country) => void
  selectedCountry?: string
}

const countries: Country[] = [
  // North America
  { id: 'usa', name: 'United States', code: 'US', continent: 'North America', position: [-2, 2, 0], color: '#3b82f6' },
  { id: 'canada', name: 'Canada', code: 'CA', continent: 'North America', position: [-2, 3, 0], color: '#ef4444' },
  { id: 'mexico', name: 'Mexico', code: 'MX', continent: 'North America', position: [-1.5, 1, 0], color: '#10b981' },
  
  // Europe
  { id: 'uk', name: 'United Kingdom', code: 'GB', continent: 'Europe', position: [0, 2.5, 0], color: '#8b5cf6' },
  { id: 'france', name: 'France', code: 'FR', continent: 'Europe', position: [0.5, 2, 0], color: '#f59e0b' },
  { id: 'germany', name: 'Germany', code: 'DE', continent: 'Europe', position: [1, 2.2, 0], color: '#06b6d4' },
  { id: 'italy', name: 'Italy', code: 'IT', continent: 'Europe', position: [1.2, 1.8, 0], color: '#84cc16' },
  { id: 'spain', name: 'Spain', code: 'ES', continent: 'Europe', position: [0.2, 1.5, 0], color: '#f97316' },
  
  // Asia
  { id: 'japan', name: 'Japan', code: 'JP', continent: 'Asia', position: [4, 2, 0], color: '#ec4899' },
  { id: 'china', name: 'China', code: 'CN', continent: 'Asia', position: [3.5, 1.8, 0], color: '#dc2626' },
  { id: 'india', name: 'India', code: 'IN', continent: 'Asia', position: [2.8, 1, 0], color: '#059669' },
  { id: 'singapore', name: 'Singapore', code: 'SG', continent: 'Asia', position: [3.2, 0.5, 0], color: '#7c3aed' },
  { id: 'thailand', name: 'Thailand', code: 'TH', continent: 'Asia', position: [3, 0.8, 0], color: '#ea580c' },
  { id: 'malaysia', name: 'Malaysia', code: 'MY', continent: 'Asia', position: [3.1, 0.3, 0], color: '#0891b2' },
  
  // Oceania
  { id: 'australia', name: 'Australia', code: 'AU', continent: 'Oceania', position: [4, -1, 0], color: '#be185d' },
  { id: 'newzealand', name: 'New Zealand', code: 'NZ', continent: 'Oceania', position: [4.5, -1.5, 0], color: '#0d9488' },
  
  // Middle East
  { id: 'uae', name: 'United Arab Emirates', code: 'AE', continent: 'Middle East', position: [2, 1.2, 0], color: '#7c2d12' },
  { id: 'saudi', name: 'Saudi Arabia', code: 'SA', continent: 'Middle East', position: [1.8, 1.5, 0], color: '#1e40af' },
  
  // Africa
  { id: 'southafrica', name: 'South Africa', code: 'ZA', continent: 'Africa', position: [1.5, -0.5, 0], color: '#16a34a' },
]

// Simplified fallback component for when 3D map fails to load
function SimpleCountryList({ countries, onCountrySelect, selectedCountry }: {
  countries: Country[]
  onCountrySelect: (country: Country) => void
  selectedCountry?: string
}) {
  return (
    <div className="w-full h-96 border rounded-lg bg-gradient-to-b from-blue-900 to-blue-700 p-4 overflow-hidden flex flex-col">
      <div className="text-white text-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold">Select a Country</h3>
        <p className="text-sm opacity-80">Choose your destination country</p>
      </div>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 pr-2">
        {countries.map((country) => (
          <button
            key={country.id}
            onClick={() => onCountrySelect(country)}
            className={`p-2 rounded text-sm text-left transition-colors flex-shrink-0 ${
              selectedCountry === country.id
                ? 'bg-yellow-400 text-black'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: country.color }}
              />
              <span className="font-medium">{country.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function WorldMap({ onCountrySelect, selectedCountry }: WorldMapProps) {
  const [selectedContinent, setSelectedContinent] = useState<string>('All')
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(countries)

  useEffect(() => {
    if (selectedContinent === 'All') {
      setFilteredCountries(countries)
    } else {
      setFilteredCountries(countries.filter(country => country.continent === selectedContinent))
    }
  }, [selectedContinent])

  const continents = ['All', ...Array.from(new Set(countries.map(c => c.continent)))]

  return (
    <div className="w-full h-full">
      {/* Continent Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {continents.map((continent) => (
          <button
            key={continent}
            onClick={() => setSelectedContinent(continent)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedContinent === continent
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {continent}
          </button>
        ))}
      </div>

      {/* Map Display */}
      <SimpleCountryList 
        countries={filteredCountries}
        onCountrySelect={onCountrySelect}
        selectedCountry={selectedCountry}
      />
    </div>
  )
}



