import React from "react"
import { Button } from "./ui/button"

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 inline-block text-gray-700 flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
)

const features = [
  {
    title: "Simple, Private",
    points: [
      "No need to connect bank",
      "export to excel anytime",
      "we use only screenshots"
    ]
  },
  {
    title: "Cancel made simple",
    points: [
      "help you find the cancel button",
      "make cancel easy",
      "full guide available"
    ]
  },
  {
    title: "Our deal:",
    points: [
      "Get started for free",
      "Pay us $10/month",
      "Save over $50/mo* on apps"
    ]
  }
]

export default function LandingScreen() {
  const handleRedirect = () => {
    chrome.tabs.create({ url: "https://cancelmysub.app" })
  }

  return (
    <div className="flex flex-col h-[580px] w-[380px] bg-white p-6">
      <header className="w-full flex justify-center items-center mb-4">
        <img src={require("src/assets/logo.svg")} alt="logo" className="h-10" />
      </header>
      <main className="flex flex-col items-center justify-center text-center flex-grow">
        <h1 className="text-2xl font-bold mb-4">Manage Your Subscriptions</h1>
        <div className="space-y-3 w-full">
          {features.map((featureSet) => (
            <div
              key={featureSet.title}
              className="border border-gray-200 rounded-xl p-3 text-left w-full bg-gray-50">
              <h3 className="font-bold text-base mb-2 text-gray-800">
                {featureSet.title}
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {featureSet.points.map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div >
        <div className="mt-6" />
        <Button
          onClick={handleRedirect}
          className="bg-gray-900 text-white  font-bold py-3 px-6 rounded-lg text-base hover:bg-gray-800 transition-colors mt-auto w-full">
          Get Started
        </Button>
      </main>
      <footer className="w-full pt-4 text-center text-gray-500 text-xs">
        <p>
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleRedirect()
            }}
            className="text-blue-600 hover:underline">
            Sign in here
          </a>
        </p>
      </footer>
    </div>
  )
} 