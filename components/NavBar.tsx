'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { LogOut, Package, ClipboardList, Users, LayoutDashboard, TrendingUp, UserCircle, Tag, ShieldCheck } from 'lucide-react'

interface Props {
  client: Client | null
}

export default function NavBar({ client }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isAdmin = client?.is_admin

  const links = isAdmin
    ? [
        { href: '/admin', label: 'Pedidos', icon: LayoutDashboard, exact: true },
        { href: '/admin/stats', label: 'Facturación', icon: TrendingUp },
        { href: '/admin/products', label: 'Productos', icon: Package },
        { href: '/admin/clients', label: 'Clientes', icon: Users },
        { href: '/admin/precios', label: 'Precios', icon: Tag },
        { href: '/admin/garantias', label: 'Garantías', icon: ShieldCheck },
      ]
    : [
        { href: '/catalog', label: 'Catálogo', icon: Package },
        { href: '/orders', label: 'Mis Pedidos', icon: ClipboardList },
        { href: '/profile', label: 'Mi Perfil', icon: UserCircle },
      ]

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-[#2D4535] text-[#F0E8D8]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={isAdmin ? '/admin' : '/catalog'} className="flex items-center gap-2">
            <Image
              src="/logo-tabare.png"
              alt="Tabaré Mates"
              width={90}
              height={28}
              className="brightness-0 invert"
            />
            {isAdmin && (
              <span className="text-xs bg-[#B8935A]/30 text-[#B8935A] px-1.5 py-0.5 rounded-md">
                Admin
              </span>
            )}
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${isActive(href, exact)
                    ? 'bg-[#F0E8D8]/15 text-white'
                    : 'text-[#F0E8D8]/70 hover:text-white hover:bg-[#F0E8D8]/10'
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            {client && (
              <span className="hidden sm:block text-xs text-[#F0E8D8]/60">
                {client.name}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-[#F0E8D8]/60 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-2">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors
                ${isActive(href, exact)
                  ? 'bg-[#F0E8D8]/15 text-white'
                  : 'text-[#F0E8D8]/70 hover:text-white hover:bg-[#F0E8D8]/10'
                }`}
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
