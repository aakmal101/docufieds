'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Phone, Clock, CheckCircle, User, Calendar, MessageCircle, ArrowLeft } from 'lucide-react'

interface CustomerCallScreenProps {
  onBack: () => void
  onComplete: () => void
}

const callSteps = [
  {
    id: 1,
    title: 'Document Review',
    description: 'Our representative will review your submitted documents',
    duration: '5-10 minutes',
    status: 'pending'
  },
  {
    id: 2,
    title: 'Application Verification',
    description: 'Verification of your application details and requirements',
    duration: '10-15 minutes',
    status: 'pending'
  },
  {
    id: 3,
    title: 'Additional Information',
    description: 'Collection of any additional information needed',
    duration: '5-10 minutes',
    status: 'pending'
  },
  {
    id: 4,
    title: 'Next Steps Discussion',
    description: 'Discussion of next steps and timeline',
    duration: '5 minutes',
    status: 'pending'
  }
]

export default function CustomerCallScreen({ onBack, onComplete }: CustomerCallScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [representativeInfo, setRepresentativeInfo] = useState({
    name: 'Sarah Johnson',
    department: 'Visa Processing',
    experience: '5+ years',
    languages: ['English', 'Spanish', 'French']
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startCall = () => {
    setIsCallActive(true)
    setCurrentStep(0)
  }

  const endCall = () => {
    setIsCallActive(false)
    setCallDuration(0)
  }

  const nextStep = () => {
    if (currentStep < callSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === callSteps.length - 1) {
      // If on the last step, automatically complete the process
      completeCall()
    }
  }

  const completeCall = () => {
    endCall()
    onComplete()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Representative Call</h1>
        <p className="text-gray-600">
          A dedicated customer representative will call you to guide you through the next steps of your application process.
        </p>
      </div>

      {/* Representative Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 text-red-600 mr-2" />
            Your Dedicated Representative
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{representativeInfo.name}</h3>
              <p className="text-gray-600">{representativeInfo.department}</p>
              <p className="text-sm text-gray-500">Experience: {representativeInfo.experience}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Languages:</span>
                {representativeInfo.languages.map((lang, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Status */}
      {!isCallActive ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 text-red-600 mr-2" />
              Ready to Connect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start Your Call</h3>
              <p className="text-gray-600 mb-6">
                Click the button below to connect with your dedicated representative.
                The call will take approximately 30-40 minutes.
              </p>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-lg px-8 py-3"
                onClick={startCall}
              >
                <Phone className="h-5 w-5 mr-2" />
                Start Call
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-green-600 mr-2" />
                Call in Progress
              </div>
              <div className="text-green-600 font-mono text-lg">
                {formatTime(callDuration)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connected with {representativeInfo.name}</h3>
              <p className="text-gray-600 mb-4">Your call is active. Follow the steps below.</p>
              <Button 
                variant="outline" 
                onClick={endCall}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                End Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 text-red-600 mr-2" />
            Call Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {callSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center p-4 rounded-lg border ${
                  index === currentStep && isCallActive
                    ? 'border-red-500 bg-red-50'
                    : index < currentStep
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep && isCallActive
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{step.duration}</span>
                  </div>
                </div>
                {index === currentStep && isCallActive && (
                  <Button size="sm" onClick={nextStep} className="bg-red-600 hover:bg-red-700">
                    Next Step
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 text-red-600 mr-2" />
            Call Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What to Expect</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Document review and verification</li>
                <li>• Application process explanation</li>
                <li>• Timeline and next steps</li>
                <li>• Answer to your questions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Preparation</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Have your documents ready</li>
                <li>• Prepare any questions</li>
                <li>• Ensure good internet connection</li>
                <li>• Find a quiet environment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        {isCallActive && currentStep === callSteps.length - 1 && (
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={completeCall}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Process
          </Button>
        )}
      </div>
    </div>
  )
}
