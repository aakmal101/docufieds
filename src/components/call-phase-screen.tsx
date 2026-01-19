'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  CheckCircle, 
  MessageCircle, 
  ArrowLeft, 
  Info,
  FileText,
  Clock,
  Users
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'

interface CallPhaseScreenProps {
  applicationId: string
  onBackToDashboard: () => void
}

const processStages = [
  {
    id: 'submission',
    title: 'Application Submitted',
    description: 'Your application has been successfully submitted and is now in our system.',
    details: 'All required documents have been verified and payment has been confirmed. Your application is now queued for processing by our team.',
    status: 'completed'
  },
  {
    id: 'review',
    title: 'Document Review',
    description: 'Our legal team is reviewing your submitted documents for completeness and accuracy.',
    details: 'This stage involves thorough verification of all documents against visa requirements. Our team checks for any missing information or discrepancies that may need clarification.',
    status: 'current'
  },
  {
    id: 'processing',
    title: 'Application Processing',
    description: 'Your application is being processed and prepared for embassy submission.',
    details: 'During this stage, we compile all necessary documentation, prepare application forms, and ensure everything meets embassy requirements. This typically takes 3-5 business days.',
    status: 'upcoming'
  },
  {
    id: 'embassy',
    title: 'Embassy Submission',
    description: 'Your application will be submitted to the respective embassy for final review.',
    details: 'Once processing is complete, we will submit your application to the embassy. You will receive updates on the submission status and any additional requirements.',
    status: 'upcoming'
  },
  {
    id: 'decision',
    title: 'Visa Decision',
    description: 'Awaiting decision from the embassy on your visa application.',
    details: 'The embassy will review your application and make a decision. Processing times vary by country and visa type. You will be notified immediately once a decision is made.',
    status: 'upcoming'
  }
]

export default function CallPhaseScreen({ applicationId, onBackToDashboard }: CallPhaseScreenProps) {
  const router = useRouter()

  const handleStartMessaging = () => {
    // Route to messaging tab with support chat
    router.push('/dashboard/individual/messaging?chat=support')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Status Message */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <CardTitle className="text-2xl text-green-900">
              Application Successfully Submitted
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-green-800 mb-4">
            Your application has been submitted. You will receive a call from our team.
          </p>
          <p className="text-sm text-green-700">
            Our support team will contact you within 24-48 hours to discuss your application and answer any questions you may have.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button 
          className="bg-red-600 hover:bg-red-700 flex-1"
          onClick={handleStartMessaging}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Start Messaging
        </Button>
        <Button 
          variant="outline" 
          onClick={onBackToDashboard}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Informational Process Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 text-red-600 mr-2" />
            Application Process Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {processStages.map((stage, index) => (
              <AccordionItem key={stage.id} value={stage.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      stage.status === 'completed' 
                        ? 'bg-green-500 text-white'
                        : stage.status === 'current'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {stage.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{stage.title}</span>
                        {stage.status === 'current' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            Current Stage
                          </Badge>
                        )}
                        {stage.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-12 pr-4 pb-2">
                    <p className="text-gray-700 leading-relaxed">{stage.details}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Additional Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 text-red-600 mr-2" />
              Expected Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Document Review: 2-3 business days</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Application Processing: 3-5 business days</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Embassy Processing: Varies by country</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 text-red-600 mr-2" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-3">
              Our support team is here to assist you throughout the process.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleStartMessaging}
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
