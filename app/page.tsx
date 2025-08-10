"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plane,
  Users,
  Plus,
  Settings,
  LogIn,
  LogOut,
  Trash2,
  UserPlus,
  Shield,
  Star,
  User,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

// Import Server Actions and types
import {
  getFlights,
  addFlight,
  deleteFlight,
  updateFlightInterest,
  updateFlightStatus,
  getUsers,
  addUser,
  deleteUser,
  findUser,
  updateUser,
  getActionLogs,
  addActionLog,
  deleteActionLog,
} from "@/actions"
import type { Flight, ASAUser, ActionLog } from "@/lib/types" // Import types from new file

export default function AtlanticSkyAirways() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [users, setUsers] = useState<ASAUser[]>([])
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [flightInterest, setFlightInterest] = useState<Record<string, number>>({})
  const [currentUser, setCurrentUser] = useState<ASAUser | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminTab, setAdminTab] = useState<"flights" | "users" | "logs" | "profile">("flights")
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [newFlight, setNewFlight] = useState({
    number: "",
    route: "",
    date: "",
    time: "",
    gate: "",
    gameLink: "", // Added gameLink to newFlight state
  })
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "hr" as "hr" | "personnel",
  })
  const [newActionLog, setNewActionLog] = useState({
    action: "kick" as "kick" | "warn" | "ban" | "other",
    targetUser: "",
    reason: "",
  })
  const [ownerProfile, setOwnerProfile] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [landingPageExiting, setLandingPageExiting] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [showPurchaseWarning, setShowPurchaseWarning] = useState(false)
  const [purchaseUrl, setPurchaseUrl] = useState("")

  // Fetch initial data on component mount
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const fetchedFlights = await getFlights()
    const fetchedUsers = await getUsers()
    const fetchedActionLogs = await getActionLogs()

    setFlights(fetchedFlights)
    setUsers(fetchedUsers)
    setActionLogs(fetchedActionLogs)

    const initialInterest: Record<string, number> = {}
    fetchedFlights.forEach((flight) => {
      initialInterest[flight.number] = flight.interested
    })
    setFlightInterest(initialInterest)
    setIsLoading(false)
    setShowLoadingScreen(false)
  }, [])

  useEffect(() => {
    if (!isLoading && !showLandingPage && showLoadingScreen) {
      fetchData()
    }
  }, [fetchData, isLoading, showLandingPage, showLoadingScreen])

  // Floating animation for hero elements
  useEffect(() => {
    const interval = setInterval(() => {
      const elements = document.querySelectorAll(".floating")
      elements.forEach((el, index) => {
        const element = el as HTMLElement
        element.style.transform = `translateY(${Math.sin(Date.now() * 0.001 + index) * 10}px)`
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    const user = await findUser(loginForm.username, loginForm.password)

    if (user && (user.role === "owner" || user.role === "hr" || user.role === "personnel")) {
      setCurrentUser(user)
      setShowLogin(false)
      setLoginForm({ username: "", password: "" })
      setLoginError("")
    } else {
      setLoginError("Invalid username or password. Please try again.")
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setShowAdmin(false)
    setAdminTab("flights")
  }

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !currentUser ||
      (currentUser.role !== "owner" && currentUser.role !== "hr" && currentUser.role !== "personnel")
    ) {
      alert("Unauthorized access")
      return
    }

    setIsLoading(true)
    try {
      const addedFlight = await addFlight(newFlight)
      setFlights((prev) => [...prev, addedFlight])
      setFlightInterest((prev) => ({ ...prev, [addedFlight.number]: addedFlight.interested }))
      setNewFlight({ number: "", route: "", date: "", time: "", gate: "", gameLink: "" }) // Reset gameLink
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFlight = async (flightId: string, flightNumber: string) => {
    if (
      !currentUser ||
      (currentUser.role !== "owner" && currentUser.role !== "hr" && currentUser.role !== "personnel")
    ) {
      alert("Unauthorized access")
      return
    }

    await deleteFlight(flightId)
    setFlights((prev) => prev.filter((f) => f.id !== flightId))
    setFlightInterest((prev) => {
      const updated = { ...prev }
      delete updated[flightNumber]
      return updated
    })
  }

  const handleToggleFlightActive = async (flightId: string, checked: boolean) => {
    if (
      !currentUser ||
      (currentUser.role !== "owner" && currentUser.role !== "hr" && currentUser.role !== "personnel")
    ) {
      alert("Unauthorized access")
      return
    }
    setIsLoading(true)
    try {
      const updatedFlight = await updateFlightStatus(flightId, checked)
      if (updatedFlight) {
        setFlights((prev) => prev.map((f) => (f.id === flightId ? { ...f, isActive: updatedFlight.isActive } : f)))
      } else {
        alert("Failed to update flight status.")
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || currentUser.role !== "owner") {
      alert("Only the owner can create accounts")
      return
    }

    setIsLoading(true)
    try {
      const addedUser = await addUser(newUser, currentUser.username)
      setUsers((prev) => [...prev, addedUser])
      setNewUser({ username: "", password: "", role: "hr" })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== "owner") {
      alert("Only the owner can delete accounts")
      return
    }

    if (userId === currentUser.id) {
      alert("Cannot delete your own account")
      return
    }

    await deleteUser(userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleAddActionLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !currentUser ||
      (currentUser.role !== "owner" && currentUser.role !== "hr" && currentUser.role !== "personnel")
    ) {
      alert("Unauthorized access")
      return
    }

    setIsLoading(true)
    try {
      const addedLog = await addActionLog(newActionLog, currentUser.username)
      setActionLogs((prev) => [addedLog, ...prev])
      setNewActionLog({ action: "kick", targetUser: "", reason: "" })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteActionLog = async (logId: string) => {
    if (!currentUser || currentUser.role !== "owner") {
      alert("Only the owner can delete action logs")
      return
    }

    await deleteActionLog(logId)
    setActionLogs((prev) => prev.filter((log) => log.id !== logId))
  }

  const handleUpdateOwnerProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || currentUser.role !== "owner") {
      alert("Unauthorized access")
      return
    }

    if (currentUser.password !== ownerProfile.currentPassword) {
      alert("Current password is incorrect")
      return
    }

    if (ownerProfile.newPassword !== ownerProfile.confirmPassword) {
      alert("New passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const updatedUser = await updateUser(currentUser.id, {
        username: ownerProfile.username,
        password: ownerProfile.newPassword,
      })

      if (updatedUser) {
        setCurrentUser(updatedUser)
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updatedUser.id ? { ...u, username: updatedUser.username, password: updatedUser.password } : u,
          ),
        )
        setOwnerProfile({ username: "", currentPassword: "", newPassword: "", confirmPassword: "" })
        alert("Profile updated successfully!")
      } else {
        alert("Failed to update profile.")
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInterestClick = async (flightNumber: string) => {
    const updatedInterest = await updateFlightInterest(flightNumber)
    setFlightInterest((prev) => ({
      ...prev,
      [flightNumber]: updatedInterest,
    }))
  }

  const handleStartJourney = () => {
    setLandingPageExiting(true)
    setTimeout(() => {
      setShowLandingPage(false)
      setShowLoadingScreen(true)
      fetchData()
    }, 1000)
  }

  const handlePurchaseClick = (url: string) => {
    setPurchaseUrl(url)
    setShowPurchaseWarning(true)
  }

  const handleProceedToRoblox = () => {
    window.open(purchaseUrl, "_blank")
    setShowPurchaseWarning(false)
  }

  const canManageFlights =
    currentUser && (currentUser.role === "owner" || currentUser.role === "hr" || currentUser.role === "personnel")
  const canManageUsers = currentUser && currentUser.role === "owner"
  const canLogActions =
    currentUser && (currentUser.role === "owner" || currentUser.role === "hr" || currentUser.role === "personnel")

  const getActionIcon = (action: string) => {
    switch (action) {
      case "kick":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "ban":
        return <Shield className="h-4 w-4 text-red-400" />
      default:
        return <FileText className="h-4 w-4 text-blue-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "kick":
        return "text-orange-300"
      case "warn":
        return "text-yellow-300"
      case "ban":
        return "text-red-300"
      default:
        return "text-blue-300"
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "hr":
        return "HR Staff"
      case "personnel":
      case "owner":
        return "Owner"
      default:
        return role
    }
  }

  const activeFlights = flights.filter((f) => f.isActive)
  const scheduledFlights = flights.filter((f) => !f.isActive)

  return (
    <>
      {showLandingPage && (
        <div
          className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-cover bg-center transition-all duration-1000 ease-in-out backdrop-blur-md ${
            landingPageExiting ? "translate-y-[-100%] opacity-0" : "translate-y-0 opacity-100"
          }`}
          style={{
            backgroundImage: `url('/images/united-airplane-hero.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 text-center">
            <h1 className="text-8xl md:text-[10rem] font-black text-white mb-8 tracking-tight leading-none animate-glow">
              United Airlines
            </h1>
            <Button
              onClick={handleStartJourney}
              className="bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold rounded-xl px-10 py-5 text-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      )}

      {showLoadingScreen && (
        <div className="fixed inset-0 z-[998] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <Plane className="h-24 w-24 text-sky-400 animate-bounce" />
          <h2 className="text-4xl font-bold mt-8 animate-pulse">Loading United Airlines...</h2>
          <p className="text-sky-200 mt-4">Preparing your premium aviation experience.</p>
        </div>
      )}

      <div
        className={`min-h-screen bg-cover bg-center bg-fixed relative overflow-x-hidden ${
          showLandingPage || showLoadingScreen ? "hidden" : ""
        }`}
        style={{
          backgroundImage: `
          linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.9) 100%),
          radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
          url('/images/airplane-tails-v2.png')
        `,
        }}
      >
        {/* Animated background particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-sky-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 border-b border-white/20 shadow-2xl">
          <div className="container mx-auto px-4 py-0 h-20 flex items-center justify-between">
            <div className="flex-shrink-0">
              {/* Removed the Image component for the logo */}
              <span className="text-white text-2xl font-bold">United Airlines</span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-8">
                {[
                  { name: "Upgrades", id: "upgrades" },
                  { name: "About", id: "about" },
                  { name: "Contact", id: "contact" },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.id)}
                    className="relative text-white hover:text-sky-300 transition-all duration-300 font-medium group py-2 cursor-pointer"
                  >
                    {item.name}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-sky-400 to-purple-400 group-hover:w-full transition-all duration-300" />
                  </button>
                ))}
              </div>

              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold flex items-center">
                      {currentUser.role === "owner" && <Shield className="h-4 w-4 mr-1 text-yellow-400" />}
                      {currentUser.username}
                    </div>
                    <div className="text-sky-300 text-xs">{getRoleDisplay(currentUser.role)}</div>
                  </div>
                  {canManageFlights && (
                    <Button
                      onClick={() => setShowAdmin(!showAdmin)}
                      className="bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLogin(true)}
                  className="bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Staff Login
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="container mx-auto px-4 pt-24 pb-12 relative z-10 space-y-12">
          {/* Main Page Hero Section */}
          <section className="text-center py-16 md:py-24">
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up">
              Fly with <span className="text-sky-400">United Airlines</span>
            </h1>
            <p className="text-xl text-sky-100 max-w-3xl mx-auto mb-10 animate-fade-in-up delay-200">
              {"Premuim Roblox Airline\n"}
            </p>
            <Button
              onClick={() => scrollToSection("active-flights")}
              className="bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold rounded-xl px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up delay-400"
            >
              Explore Flights
            </Button>
          </section>

          {/* Active Flights Section */}
          <section id="active-flights" className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Active Flights</h2>
            {activeFlights.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-white/20">
                <Plane className="h-16 w-16 text-sky-400/50 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No active flights currently.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeFlights.map((flight) => (
                  <Card key={flight.id} className="bg-white/5 border border-white/20 backdrop-blur-md text-white">
                    <CardHeader>
                      <CardTitle className="text-sky-300 text-2xl">{flight.number}</CardTitle>
                      <p className="text-lg font-medium">{flight.route}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-white/80">Date: {flight.date}</p>
                      <p className="text-sm text-white/80">Time: {flight.time}</p>
                      <p className="text-sm text-white/80">Gate: {flight.gate}</p>
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          onClick={() => handleInterestClick(flight.number)}
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 flex items-center"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Interested: {flightInterest[flight.number] || 0}
                        </Button>
                        {flight.gameLink && (
                          <Button
                            onClick={() => window.open(flight.gameLink, "_blank")}
                            className="bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            Join Game
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* All Scheduled Flights Section */}
          <section id="all-scheduled-flights" className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">All Scheduled Flights</h2>
            {scheduledFlights.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-white/20">
                <Plane className="h-16 w-16 text-sky-400/50 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No scheduled flights at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledFlights.map((flight) => (
                  <Card key={flight.id} className="bg-white/5 border border-white/20 backdrop-blur-md text-white">
                    <CardHeader>
                      <CardTitle className="text-sky-300 text-2xl">{flight.number}</CardTitle>
                      <p className="text-lg font-medium">{flight.route}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-white/80">Date: {flight.date}</p>
                      <p className="text-sm text-white/80">Time: {flight.time}</p>
                      <p className="text-sm text-white/80">Gate: {flight.gate}</p>
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          onClick={() => handleInterestClick(flight.number)}
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 flex items-center"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Interested: {flightInterest[flight.number] || 0}
                        </Button>
                        {/* No "Join Game" button for scheduled flights */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Upgrades Section */}
          <section id="upgrades" className="py-12">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Premium Upgrades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card className="bg-white/5 border border-white/20 backdrop-blur-md text-white">
                <CardHeader>
                  <CardTitle className="text-sky-300 text-2xl">Investor Class</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-white/80">
                    Investor Class has a lot of amazing stuff, it will make your experience a thousand times luxurious
                    and you will have your own private seat. It will give you a premium vibe you never had before. Get
                    access to amazing drinks and food on board and get treated like a king. Once you fly with United
                    Airlines, you will never go back.
                  </p>
                  <Button
                    onClick={() =>
                      handlePurchaseClick("https://www.roblox.com/catalog/15286721815/Investor-Classfeatures")
                    }
                    className="mt-4 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg"
                  >
                    Purchase Investor Class
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border border-white/20 backdrop-blur-md text-white">
                <CardHeader>
                  <CardTitle className="text-sky-300 text-2xl">First Class</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-white/80">
                    When you buy First Class, you will get access to an amazing lounge in our airports, exclusive meals
                    on our flights and a luxurious seat onboard. Get treated like a VIP like you never have been before.
                  </p>
                  <Button
                    onClick={() =>
                      handlePurchaseClick("https://www.roblox.com/catalog/15146113890/First-classfeatures")
                    }
                    className="mt-4 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg"
                  >
                    Purchase First Class
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-12 text-white">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">About United Airlines</h2>
            <div className="bg-white/5 rounded-xl p-8 border border-white/20 backdrop-blur-md max-w-4xl mx-auto">
              <p className="text-lg mb-4 text-white/80">
                United Airlines was established in late 2023 with the objective of creating a dynamic and immersive
                Ro-Aviation community within the Roblox platform. Our mission is to provide an engaging and memorable
                experience for all participants, whether as passengers utilizing our services or as esteemed members of
                our operational team. We are dedicated to upholding the highest standards of excellence, investing
                considerable time and effort to deliver a premium virtual aviation experience. Through realistic flight
                operations and thoughtfully organized community events, United Airlines endeavors to set a new standard
                of professionalism and innovation in the Ro-Aviation industry.
              </p>
              <p className="text-lg text-white/80">
                This document provides an overview of the rules and communication guidelines for our server, created to
                help maintain a safe, friendly, and enjoyable environment for everyone in the community. By following
                these guidelines, you’ll help ensure that the server remains a positive space where all members feel
                welcome and respected. We encourage you to take the time to carefully read through these documents and
                fully understand the policies we’ve put in place. They’re designed to promote fairness, inclusivity, and
                smooth communication among members. If there’s anything you’re unsure about or if you have any
                questions, don’t hesitate to reach out. Our team is here to support you and make sure you have a great
                time in our community!
              </p>
              <p className="text-lg text-white/80 font-semibold mt-4">
                <a
                  href="https://docs.google.com/document/d/1sOK_UgsCkpnIlXhYKfMDG3hksbduqpusu0jsjtJq05M/edit?tab=t.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:underline"
                >
                  United Airlines Terms Of Service
                </a>
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-12 text-white">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Contact Us</h2>
            <div className="bg-white/5 rounded-xl p-8 border border-white/20 backdrop-blur-md max-w-2xl mx-auto space-y-6">
              <p className="text-lg text-white/80 text-center">
                Have questions or need assistance? Reach out to our support team.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2 text-lg">
                  <span className="font-medium">{"Roblox: "}</span>
                  <a
                    href="https://www.roblox.com/communities/33198505/Atlantic-Sky-Airways"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300 hover:underline"
                  >
                    {"https://www.roblox.com/communities/33198505/Atlantic-Sky-Airways"}
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-lg">
                  <span className="font-medium">{"Tiktok: "}</span>
                  <a
                    href="https://www.tiktok.com/@atlanticskyairways"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300 hover:underline"
                  >
                    {"https://www.tiktok.com/@atlanticskyairways"}
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-lg">
                  <span className="font-medium">{"Discord:"}</span>
                  <a
                    href="https://discord.gg/74we98DgEM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300 hover:underline"
                  >
                    https://discord.gg/74we98DgEM
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 to-purple-900/20" />
            <Card className="w-full max-w-md backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/30 shadow-2xl relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg blur opacity-20" />
              <CardHeader className="relative">
                <CardTitle className="text-white text-center text-2xl font-bold flex items-center justify-center">
                  <Shield className="h-6 w-6 mr-2 text-sky-400" />
                  Staff Login
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <form onSubmit={handleLogin} className="space-y-6">
                  {loginError && (
                    <div className="bg-red-600/20 border border-red-400/30 rounded-lg p-3 flex items-center space-x-2">
                      <X className="h-4 w-4 text-red-400" />
                      <span className="text-red-300 text-sm font-medium">{loginError}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Logging in...
                        </div>
                      ) : (
                        "Login"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowLogin(false)
                        setLoginError("")
                        setLoginForm({ username: "", password: "" })
                      }}
                      className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Panel */}
        {showAdmin && canManageFlights && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 to-purple-900/20" />
            <Card className="w-full max-w-5xl max-h-[85vh] overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/30 shadow-2xl relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg blur opacity-20" />
              <CardHeader className="relative border-b border-white/20">
                <CardTitle className="text-white text-center text-2xl font-bold flex items-center justify-center">
                  <Settings className="h-6 w-6 mr-2 text-sky-400" />
                  Admin Dashboard
                </CardTitle>
                <div className="flex justify-center space-x-2 mt-4 flex-wrap gap-2">
                  <Button
                    onClick={() => setAdminTab("flights")}
                    variant={adminTab === "flights" ? "default" : "outline"}
                    className={
                      adminTab === "flights"
                        ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white border-0"
                        : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                    }
                  >
                    <Plane className="h-4 w-4 mr-2" />
                    Flights
                  </Button>
                  {canManageUsers && (
                    <Button
                      onClick={() => setAdminTab("users")}
                      variant={adminTab === "users" ? "default" : "outline"}
                      className={
                        adminTab === "users"
                          ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white border-0"
                          : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                      }
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Users
                    </Button>
                  )}
                  {canLogActions && (
                    <Button
                      onClick={() => setAdminTab("logs")}
                      variant={adminTab === "logs" ? "default" : "outline"}
                      className={
                        adminTab === "logs"
                          ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white border-0"
                          : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Action Logs
                    </Button>
                  )}
                  {currentUser?.role === "owner" && (
                    <Button
                      onClick={() => setAdminTab("profile")}
                      variant={adminTab === "profile" ? "default" : "outline"}
                      className={
                        adminTab === "profile"
                          ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white border-0"
                          : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                      }
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative overflow-y-auto max-h-[60vh] p-6">
                {adminTab === "flights" && (
                  <div className="space-y-8">
                    {/* Add Flight Form */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <form onSubmit={handleAddFlight} className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <Plus className="h-5 w-5 mr-2 text-sky-400" />
                          Add New Flight
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: "number", label: "Flight Number", placeholder: "UA001" },
                            { key: "route", label: "Route", placeholder: "New York → London" },
                            { key: "date", label: "Date", placeholder: "Dec 15, 2024" },
                            { key: "time", label: "Time", placeholder: "14:30 EST" },
                            { key: "gate", label: "Gate", placeholder: "A12" },
                            {
                              key: "gameLink",
                              label: "Roblox Game Link (Optional)",
                              placeholder: "https://www.roblox.com/games/...",
                            }, // Added gameLink input
                          ].map((field) => (
                            <div key={field.key} className={field.key === "gate" ? "md:col-span-1" : ""}>
                              <Label htmlFor={field.key} className="text-white font-medium">
                                {field.label}
                              </Label>
                              <Input
                                id={field.key}
                                value={newFlight[field.key as keyof typeof newFlight]}
                                onChange={(e) => setNewFlight((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                                placeholder={field.placeholder}
                                required={field.key !== "gameLink"} // gameLink is optional
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Adding Flight...
                            </div>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Flight
                            </>
                          )}
                        </Button>
                      </form>
                    </div>

                    {/* Existing Flights (for management) */}
                    {flights.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                          <Plane className="h-5 w-5 mr-2 text-sky-400" />
                          Manage All Flights ({flights.length})
                        </h3>
                        <div className="grid gap-4">
                          {flights.map((flight) => (
                            <div
                              key={flight.id}
                              className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                              <div className="text-white">
                                <div className="flex items-center space-x-3">
                                  <span className="font-bold text-lg text-sky-300">{flight.number}</span>
                                  <span className="text-white/80">•</span>
                                  <span className="font-medium">{flight.route}</span>
                                </div>
                                <div className="text-sm text-sky-200 mt-1 flex items-center space-x-4">
                                  <span>{flight.date}</span>
                                  <span>•</span>
                                  <span>{flight.time}</span>
                                  <span>•</span>
                                  <span>Gate {flight.gate}</span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    {flightInterest[flight.number] || 0} interested
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white/60 text-sm">Active:</span>
                                <Switch
                                  checked={flight.isActive}
                                  onCheckedChange={(checked) => handleToggleFlightActive(flight.id, checked)}
                                  aria-label={`Toggle active status for flight ${flight.number}`}
                                />
                                <Button
                                  onClick={() => handleDeleteFlight(flight.id, flight.number)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600/20 border-red-400/30 text-red-300 hover:bg-red-600/30 hover:border-red-400/50 transition-all duration-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminTab === "users" && canManageUsers && (
                  <div className="space-y-8">
                    {/* Add User Form */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <form onSubmit={handleAddUser} className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <UserPlus className="h-5 w-5 mr-2 text-sky-400" />
                          Create New Account
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="newUsername" className="text-white font-medium">
                              Username
                            </Label>
                            <Input
                              id="newUsername"
                              value={newUser.username}
                              onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder="Enter username"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword" className="text-white font-medium">
                              Password
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder="Enter password"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newRole" className="text-white font-medium">
                              Role
                            </Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value: "hr" | "personnel") =>
                                setNewUser((prev) => ({ ...prev, role: value }))
                              }
                            >
                              <SelectTrigger className="bg-white/10 border-white/30 text-white focus:border-sky-400 focus:ring-sky-400/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/30">
                                <SelectItem value="hr" className="text-white hover:bg-white/10">
                                  HR Staff
                                </SelectItem>
                                <SelectItem value="personnel" className="text-white hover:bg-white/10">
                                  Personnel
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Creating Account...
                            </div>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create Account
                            </>
                          )}
                        </Button>
                      </form>
                    </div>

                    {/* Existing Users */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-sky-400" />
                        Staff Accounts ({users.length})
                      </h3>
                      <div className="grid gap-4">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="text-white">
                              <div className="flex items-center space-x-3">
                                {user.role === "owner" && <Shield className="h-4 w-4 text-yellow-400" />}
                                {user.role === "hr" && <Star className="h-4 w-4 text-blue-400" />}
                                {user.role === "personnel" && <User className="h-4 w-4 text-green-400" />}
                                <span className="font-bold text-lg">{user.username}</span>
                                <span className="text-white/80">•</span>
                                <span className="text-sky-300 font-medium">{getRoleDisplay(user.role)}</span>
                              </div>
                              <div className="text-sm text-sky-200 mt-1">
                                Created by {user.createdBy} • {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {user.id !== currentUser?.id && (
                              <Button
                                onClick={() => handleDeleteUser(user.id)}
                                variant="outline"
                                size="sm"
                                className="bg-red-600/20 border-red-400/30 text-red-300 hover:bg-red-600/30 hover:border-red-400/50 transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === "logs" && canLogActions && (
                  <div className="space-y-8">
                    {/* Add Action Log Form */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <form onSubmit={handleAddActionLog} className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-sky-400" />
                          Log Staff Action
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="actionType" className="text-white font-medium">
                              Action Type
                            </Label>
                            <Select
                              value={newActionLog.action}
                              onValueChange={(value: "kick" | "warn" | "ban" | "other") =>
                                setNewActionLog((prev) => ({ ...prev, action: value }))
                              }
                            >
                              <SelectTrigger className="bg-white/10 border-white/30 text-white focus:border-sky-400 focus:ring-sky-400/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/30">
                                <SelectItem value="kick" className="text-white hover:bg-white/10">
                                  Kick
                                </SelectItem>
                                <SelectItem value="warn" className="text-white hover:bg-white/10">
                                  Warn
                                </SelectItem>
                                <SelectItem value="ban" className="text-white hover:bg-white/10">
                                  Ban
                                </SelectItem>
                                <SelectItem value="other" className="text-white hover:bg-white/10">
                                  Other
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="targetUser" className="text-white font-medium">
                              Target User
                            </Label>
                            <Input
                              id="targetUser"
                              value={newActionLog.targetUser}
                              onChange={(e) => setNewActionLog((prev) => ({ ...prev, targetUser: e.target.value }))}
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder="Roblox username"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="reason" className="text-white font-medium">
                            Reason
                          </Label>
                          <Textarea
                            id="reason"
                            value={newActionLog.reason}
                            onChange={(e) => setNewActionLog((prev) => ({ ...prev, reason: e.target.value }))}
                            className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300 min-h-[80px]"
                            placeholder="Describe the reason for this action..."
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Logging Action...
                            </div>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Log Action
                            </>
                          )}
                        </Button>
                      </form>
                    </div>

                    {/* Action Logs */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-sky-400" />
                        Recent Actions ({actionLogs.length})
                      </h3>
                      {actionLogs.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-sky-400/50 mx-auto mb-4" />
                          <p className="text-white/60">No actions logged yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {actionLogs.map((log) => (
                            <div key={log.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  {getActionIcon(log.action)}
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-white font-semibold">{log.staffUsername}</span>
                                      <span className={`capitalize font-medium ${getActionColor(log.action)}`}>
                                        {log.action}ed
                                      </span>
                                      <span className="text-white font-semibold">{log.targetUser}</span>
                                    </div>
                                    <p className="text-sky-200 text-sm mt-1">{log.reason}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <span className="text-white/60 text-xs whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                  {currentUser?.role === "owner" && (
                                    <Button
                                      onClick={() => handleDeleteActionLog(log.id)}
                                      variant="outline"
                                      size="sm"
                                      className="bg-red-600/20 border-red-400/30 text-red-300 hover:bg-red-600/30 hover:border-red-400/50 transition-all duration-300 ml-2"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {adminTab === "profile" && currentUser?.role === "owner" && (
                  <div className="space-y-8">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <form onSubmit={handleUpdateOwnerProfile} className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <User className="h-5 w-5 mr-2 text-sky-400" />
                          Update Owner Profile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="profileUsername" className="text-white font-medium">
                              New Username
                            </Label>
                            <Input
                              id="profileUsername"
                              value={ownerProfile.username}
                              onChange={(e) => setOwnerProfile((prev) => ({ ...prev, username: e.target.value }))}
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder={currentUser.username}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="currentPassword" className="text-white font-medium">
                              Current Password
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={ownerProfile.currentPassword}
                              onChange={(e) =>
                                setOwnerProfile((prev) => ({ ...prev, currentPassword: e.target.value }))
                              }
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder="Enter current password"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword" className="text-white font-medium">
                              New Password
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={ownerProfile.newPassword}
                              onChange={(e) => setOwnerProfile((prev) => ({ ...prev, newPassword: e.target.value }))}
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder="Enter new password"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword" className="text-white font-medium">
                              Confirm Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={ownerProfile.confirmPassword}
                              onChange={(e) =>
                                setOwnerProfile((prev) => ({ ...prev, confirmPassword: e.target.value }))
                              }
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-300"
                              placeholder="Confirm new password"
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Updating Profile...
                            </div>
                          ) : (
                            <>
                              <User className="h-4 w-4 mr-2" />
                              Update Profile
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Purchase Warning Modal */}
        {showPurchaseWarning && (
          <Dialog open={showPurchaseWarning} onOpenChange={setShowPurchaseWarning}>
            <DialogContent className="bg-gradient-to-br from-sky-900/20 to-purple-900/20 text-white opacity-100">
              <DialogHeader>
                <DialogTitle className="text-white text-center text-2xl font-bold flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 mr-2 text-red-400" />
                  Purchase Warning
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-white text-center text-lg mt-4">
                {"After Purchasing make sure to join our discord to Claim Your Reward!"}
              </DialogDescription>
              <DialogFooter className="flex justify-center mt-8">
                <Button
                  onClick={handleProceedToRoblox}
                  className="bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Proceed to Roblox
                </Button>
                <Button
                  onClick={() => setShowPurchaseWarning(false)}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 ml-4"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  )
}
