'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "How long does the document processing take?",
        answer: "Processing times vary depending on the country and visa type. Typically, our document verification takes 24-48 hours. Embassy processing times are separate and subject to their respective workloads."
    },
    {
        question: "What documents do I need to prepare?",
        answer: "The required documents depend on the visa category. Generally, you will need a valid passport, recent photographs, proof of funds, and employment/student verification. You can check specific requirements on our 'Check Requirements' page."
    },
    {
        question: "Is my personal information secure?",
        answer: "Absolutely. We use industry-standard encryption and adhere to strict data privacy policies to ensure your sensitive documents and personal information are protected at all times."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit/debit cards, mobile financial services (MFS) like bKash/Nagad, and bank transfers. Payments are processed securely."
    },
    {
        question: "Do you guarantee a visa approval?",
        answer: "No, visa issuance is the sole prerogative of the respective Embassy or Consulate. However, our expert review significantly reduces the chances of rejection due to document errors or incompleteness."
    },
]

export function FAQ() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Everything you need to know about our services.
                    </p>
                </div>

                <div className="mx-auto max-w-3xl">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left text-lg font-medium text-gray-900">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-base text-gray-600">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    )
}
