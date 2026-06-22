"use client"
export const dynamic = 'force-dynamic'



import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, UserCheck, UserX, Crown, Music, AlertCircle } from "lucide-react"
import { redirect } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "free" | "premium" | "artist" | "unpaid">("all")

  if (!user || user.role !== "superadmin") {
    redirect("/dashboard")
  }

  // Mock user data - in real app this would come from API
  const mockUsers = [
    {
      id: "1",
      name: "Juan Pérez",
      email: "juan@example.com",
      role: "free",
      status: "active",
      joinDate: "2024-01-15",
      lastActive: "2024-01-20",
    },
    {
      id: "2",
      name: "María García",
      email: "maria@example.com",
      role: "premium",
      status: "active",
      joinDate: "2024-01-10",
      lastActive: "2024-01-20",
    },
    {
      id: "3",
      name: "Carlos López",
      email: "carlos@example.com",
      role: "artist",
      status: "active",
      joinDate: "2024-01-05",
      lastActive: "2024-01-19",
    },
    {
      id: "4",
      name: "Ana Martín",
      email: "ana@example.com",
      role: "premium",
      status: "suspended",
      joinDate: "2024-01-12",
      lastActive: "2024-01-18",
    },
    {
      id: "5",
      name: "Luis Rodríguez",
      email: "luis@example.com",
      role: "free",
      status: "active",
      joinDate: "2024-01-18",
      lastActive: "2024-01-20",
    },
    {
      id: "6",
      name: "Sofia Hernández",
      email: "sofia@example.com",
      role: "artist",
      status: "active",
      joinDate: "2024-01-08",
      lastActive: "2024-01-20",
    },
    {
      id: "7",
      name: "Pedro Gómez",
      email: "pedro@example.com",
      role: "premium",
      status: "unpaid",
      joinDate: "2024-01-03",
      lastActive: "2024-01-17",
    },
    {
      id: "8",
      name: "Carmen Ruiz",
      email: "carmen@example.com",
      role: "free",
      status: "active",
      joinDate: "2024-01-16",
      lastActive: "2024-01-20",
    },
  ]

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === "all") return matchesSearch
    if (filterType === "unpaid") return matchesSearch && user.status === "unpaid"
    return matchesSearch && user.role === filterType
  })

  const getUserStats = () => {
    const total = mockUsers.length
    const free = mockUsers.filter((u) => u.role === "free").length
    const premium = mockUsers.filter((u) => u.role === "premium").length
    const artists = mockUsers.filter((u) => u.role === "artist").length
    const unpaid = mockUsers.filter((u) => u.status === "unpaid").length

    return { total, free, premium, artists, unpaid }
  }

  const stats = getUserStats()

  return (
    <AppShell>
    <div className="max-w-7xl mx-auto min-w-0">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            Admin
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-white">Usuarios</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
        <p className="text-gray-400">Administra todos los usuarios de la plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700"
          onClick={() => setFilterType("free")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Gratuitos</p>
                <p className="text-xl font-bold text-white">{stats.free}</p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700"
          onClick={() => setFilterType("premium")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Premium</p>
                <p className="text-xl font-bold text-white">{stats.premium}</p>
              </div>
              <Crown className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700"
          onClick={() => setFilterType("artist")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Artistas</p>
                <p className="text-xl font-bold text-white">{stats.artists}</p>
              </div>
              <Music className="h-6 w-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700"
          onClick={() => setFilterType("unpaid")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sin Pagar</p>
                <p className="text-xl font-bold text-white">{stats.unpaid}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuarios por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className={filterType === "all" ? "bg-blue-600" : "border-slate-600 text-gray-400 bg-transparent"}
              >
                Todos
              </Button>
              <Button
                variant={filterType === "free" ? "default" : "outline"}
                onClick={() => setFilterType("free")}
                className={filterType === "free" ? "bg-blue-600" : "border-slate-600 text-gray-400 bg-transparent"}
              >
                Gratuitos
              </Button>
              <Button
                variant={filterType === "premium" ? "default" : "outline"}
                onClick={() => setFilterType("premium")}
                className={filterType === "premium" ? "bg-blue-600" : "border-slate-600 text-gray-400 bg-transparent"}
              >
                Premium
              </Button>
              <Button
                variant={filterType === "artist" ? "default" : "outline"}
                onClick={() => setFilterType("artist")}
                className={filterType === "artist" ? "bg-blue-600" : "border-slate-600 text-gray-400 bg-transparent"}
              >
                Artistas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            {filterType === "all"
              ? "Todos los Usuarios"
              : filterType === "free"
                ? "Usuarios Gratuitos"
                : filterType === "premium"
                  ? "Usuarios Premium"
                  : filterType === "artist"
                    ? "Artistas"
                    : "Cuentas Sin Pagar"}
          </CardTitle>
          <CardDescription>
            Mostrando {filteredUsers.length} de {mockUsers.length} usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Registro: {user.joinDate}</span>
                      <span className="text-xs text-gray-500">• Último acceso: {user.lastActive}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    className={`${
                      user.role === "premium" ? "bg-blue-500" : user.role === "artist" ? "bg-purple-500" : "bg-gray-500"
                    } text-white`}
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant={
                      user.status === "active" ? "default" : user.status === "unpaid" ? "destructive" : "secondary"
                    }
                    className={
                      user.status === "active"
                        ? "bg-green-600"
                        : user.status === "unpaid"
                          ? "bg-red-600"
                          : "bg-gray-600"
                    }
                  >
                    {user.status === "active" ? "Activo" : user.status === "unpaid" ? "Sin Pagar" : "Suspendido"}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-600 bg-transparent"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </AppShell>
  )
}
