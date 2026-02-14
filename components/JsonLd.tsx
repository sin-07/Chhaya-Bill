export default function JsonLd() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://www.chhayaprintingsolution.in',
    name: 'Chhaya Printing Solution',
    description:
      'Premium offset & digital printing services in Patna, Bihar. Business cards, brochures, banners, large-format printing, custom branding materials, wedding cards, and more.',
    url: 'https://www.chhayaprintingsolution.in',
    logo: 'https://www.chhayaprintingsolution.in/logoC.jpeg',
    image: 'https://www.chhayaprintingsolution.in/logoC.jpeg',
    telephone: '+91-XXXXX-XXXXX',
    email: 'contact@chhayaprinting.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Patna',
      addressRegion: 'Bihar',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.6093,
      longitude: 85.1376,
    },
    founder: [
      { '@type': 'Person', name: 'Shubham Kumar' },
      { '@type': 'Person', name: 'Awdhesh Kumar' },
    ],
    foundingDate: '2014',
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 25.6093,
        longitude: 85.1376,
      },
      geoRadius: '100000',
    },
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Printing Services',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Offset Printing',
          description: 'High-volume offset printing solutions',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Digital Printing',
          description: 'Quick-turnaround digital printing',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Business Cards',
          description: 'Professional business card printing',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Brochures & Flyers',
          description: 'Informative brochure and flyer printing',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Banners & Posters',
          description: 'Large format banner and poster printing',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Wedding Cards',
          description: 'Custom wedding invitation printing',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Custom Branding Materials',
          description: 'Letterheads, envelopes, and branding solutions',
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '500',
      bestRating: '5',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Chhaya Printing Solution',
    url: 'https://www.chhayaprintingsolution.in',
    description:
      'Premium printing services in Patna, Bihar – offset & digital printing, business cards, brochures, banners, and custom branding.',
    publisher: {
      '@type': 'Organization',
      name: 'Chhaya Printing Solution',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.chhayaprintingsolution.in/logoC.jpeg',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
