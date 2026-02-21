'use client'

import { Star, Quote } from 'lucide-react'
// import Image from 'next/image' // Assuming no avatar images yet, using placeholder divs

const testimonials = [
    {
        content: "Docufieds made my US visa application significantly less stressful. Their team caught an error in my documents that could have caused a rejection. Highly recommended!",
        author: "Fatima Rahman",
        role: "Tourist Visa (USA)",
        rating: 5
    },
    {
        content: "The document pick-up and delivery service is a game changer. I didn't have to leave my office, and everything was handled professionally.",
        author: "Tanvir Ahmed",
        role: "Business Visa (UK)",
        rating: 5
    },
    {
        content: "Very transparent pricing and excellent support. They guided me through the complex Schengen requirements patiently.",
        author: "Nusrat Jahan",
        role: "Student Visa (Germany)",
        rating: 5
    },
]

export function Testimonials() {
    return (
        <section className="py-24 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Trusted by Travelers
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Read what our successful applicants have to say about their experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="flex flex-col bg-gray-50 p-8 rounded-2xl relative">
                            <Quote className="absolute top-4 right-4 h-8 w-8 text-gray-200" />
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <blockquote className="flex-1 text-gray-700 italic mb-6">
                                &ldquo;{testimonial.content}&rdquo;
                            </blockquote>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
                                    {testimonial.author.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
