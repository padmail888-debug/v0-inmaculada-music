"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Crown,
  Music,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  fetchAdminUsers,
  moderateAdminUser,
  type AdminUserRow,
  type AdminUsersData,
} from "@/lib/admin-api"

type FilterType = "all" | "free" | "premium" | "artist" | "unpaid"

function parseFilter(raw: string | null): FilterType {
  if (raw === "free" || raw === "premium" || raw === "artist" || raw === "unpaid") return raw
  return "all"
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

function roleBadgeClass(role: string) {
  if (role === "premium") return "bg-blue-500"
  if (role === "artist" || role === "artist-pro") return "bg-purple-500"
  if (role === "superadmin") return "bg-amber-600"
  return "bg-gray-500"
}

function AdminUsersInner() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<FilterType>(() =>
    parseFilter(searchParams.get("filter")),
  )
  const [data, setData] = useState<AdminUsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    setFilterType(parseFilter(searchParams.get("filter")))
  }, [searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchAdminUsers()
      setData(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?redirect=/admin/users")
      return
    }
    if (user.role !== "superadmin") {
      router.replace("/dashboard")
      return
    }
    void load()
  }, [authLoading, user, router, load])

  const setFilter = (next: FilterType) => {
    setFilterType(next)
    const url = next === "all" ? "/admin/users" : `/admin/users?filter=${next}`
    router.replace(url)
  }

  const filteredUsers = useMemo(() => {
    const users = data?.users || []
    const q = searchTerm.trim().toLowerCase()
    return users.filter((row) => {
      const matchesSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (filterType === "all") return true
      if (filterType === "unpaid") return row.status === "unpaid"
      if (filterType === "artist") return row.role === "artist" || row.role === "artist-pro"
      return row.role === filterType
    })
  }, [data?.users, searchTerm, filterType])

  const onModerate = async (row: AdminUserRow, action: "activate" | "suspend") => {
    if (row.isCurrentAdmin) {
      setError("No puedes suspender tu propia cuenta")
      return
    }
    if (row.role === "superadmin") {
      setError("No se puede suspender a un Super Admin")
      return
    }
    setBusyId(row.id)
    setError(null)
    try {
      await moderateAdminUser(row.id, action)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario")
    } finally {
      setBusyId(null)
    }
  }

  const stats = data?.stats || {
    total: 0,
    free: 0,
    premium: 0,
    artists: 0,
    unpaid: 0,
    suspended: 0,
  }

  if (authLoading || !user || user.role !== "superadmin") {
    return <div className="py-16 text-center text-slate-300">Cargando…</div>
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl pb-28">
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            Admin
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-white">Usuarios</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Gestión de Usuarios</h1>
            <p className="text-gray-400">Usuarios reales de Supabase Auth</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] border-slate-600 bg-transparent text-white"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <Card
          className="cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700"
          onClick={() => setFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700"
          onClick={() => setFilter("free")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Gratuitos</p>
                <p className="text-xl font-bold text-white">{stats.free}</p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700"
          onClick={() => setFilter("premium")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Premium</p>
                <p className="text-xl font-bold text-white">{stats.premium}</p>
              </div>
              <Crown className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700"
          onClick={() => setFilter("artist")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Artistas</p>
                <p className="text-xl font-bold text-white">{stats.artists}</p>
              </div>
              <Music className="h-6 w-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700"
          onClick={() => setFilter("unpaid")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sin Pagar</p>
                <p className="text-xl font-bold text-white">{stats.unpaid}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-slate-700 bg-slate-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[48px] border-slate-600 bg-slate-700 pl-10 text-base text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Todos"],
                  ["free", "Gratuitos"],
                  ["premium", "Premium"],
                  ["artist", "Artistas"],
                  ["unpaid", "Sin pagar"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  variant={filterType === key ? "default" : "outline"}
                  onClick={() => setFilter(key)}
                  className={
                    filterType === key
                      ? "min-h-[40px] bg-blue-600"
                      : "min-h-[40px] border-slate-600 bg-transparent text-gray-300"
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800">
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
            Mostrando {filteredUsers.length} de {stats.total} usuarios
            {stats.suspended ? ` · ${stats.suspended} suspendidos` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <p className="py-8 text-center text-slate-400">Cargando usuarios…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No hay usuarios con este filtro.</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg bg-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600">
                      <span className="font-semibold text-white">
                        {(row.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {row.name}
                        {row.isCurrentAdmin ? (
                          <span className="ml-2 text-xs font-normal text-amber-300">(tú)</span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-gray-400">{row.email}</p>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span>Registro: {formatDate(row.joinDate)}</span>
                        <span>· Último acceso: {formatDate(row.lastActive)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge className={`${roleBadgeClass(row.role)} text-white`}>{row.role}</Badge>
                    <Badge
                      className={
                        row.status === "active"
                          ? "bg-green-600 text-white"
                          : row.status === "unpaid"
                            ? "bg-red-600 text-white"
                            : "bg-gray-600 text-white"
                      }
                    >
                      {row.status === "active"
                        ? "Activo"
                        : row.status === "unpaid"
                          ? "Sin Pagar"
                          : "Suspendido"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[40px] min-w-[40px] border-slate-600 bg-transparent text-white hover:bg-slate-600"
                        disabled={
                          busyId === row.id ||
                          row.status === "active" ||
                          row.isCurrentAdmin ||
                          row.role === "superadmin"
                        }
                        title="Activar (quitar suspensión)"
                        onClick={() => void onModerate(row, "activate")}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[40px] min-w-[40px] border-red-600 bg-transparent text-red-400 hover:bg-red-600 hover:text-white"
                        disabled={
                          busyId === row.id ||
                          row.status === "suspended" ||
                          row.isCurrentAdmin ||
                          row.role === "superadmin"
                        }
                        title="Suspender usuario"
                        onClick={() => void onModerate(row, "suspend")}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-16 text-center text-slate-300">Cargando…</div>}>
        <AdminUsersInner />
      </Suspense>
    </AppShell>
  )
}
