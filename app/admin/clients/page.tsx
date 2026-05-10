'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client, Product, ClientPrice } from '@/lib/types'

type NewClientForm = Partial<Client> & { password?: string }
import NavBar from '@/components/NavBar'
import { ChevronDown, ChevronUp, Save, Plus, Trash2, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type EditClientForm = Partial<Client> & { newPassword?: string }

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [allPrices, setAllPrices] = useState<ClientPrice[]>([])
  const [adminClient, setAdminClient] = useState<Client | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingPrices, setPendingPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newClient, setNewClient] = useState<NewClientForm | null>(null)
  const [createError, setCreateError] = useState('')
  const [savingClient, setSavingClient] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditClientForm>({})
  const [editError, setEditError] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const adminCheck = await fetch('/api/admin/orders')
    if (adminCheck.status === 403 || adminCheck.status === 401) {
      router.push('/catalog')
      return
    }
    const { admin } = await adminCheck.json()
    setAdminClient(admin)

    const [clientsRes, productsRes, pricesRes] = await Promise.all([
      fetch('/api/admin/clients'),
      fetch('/api/admin/products'),
      fetch('/api/admin/prices'),
    ])

    const { clients: clientsData } = await clientsRes.json()
    const { products: productsData } = await productsRes.json()
    const { prices: pricesData } = await pricesRes.json()

    setClients(clientsData ?? [])
    setProducts(productsData ?? [])
    setAllPrices(pricesData ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  function getPriceForClient(clientId: string, productId: string) {
    return allPrices.find(p => p.client_id === clientId && p.product_id === productId)
  }

  function getPendingKey(clientId: string, productId: string, field: 'price_usd' | 'price_ars' | 'price_eur') {
    return `${clientId}__${productId}__${field}`
  }

  function getDisplayPrice(clientId: string, productId: string, field: 'price_usd' | 'price_ars' | 'price_eur') {
    const key = getPendingKey(clientId, productId, field)
    if (key in pendingPrices) return pendingPrices[key]
    const existing = getPriceForClient(clientId, productId)
    return existing?.[field]?.toString() ?? ''
  }

  function handlePriceChange(clientId: string, productId: string, field: 'price_usd' | 'price_ars' | 'price_eur', value: string) {
    const key = getPendingKey(clientId, productId, field)
    setPendingPrices(prev => ({ ...prev, [key]: value }))
  }

  async function savePricesForClient(clientId: string) {
    setSaving(clientId)

    for (const product of products) {
      const usdKey = getPendingKey(clientId, product.id, 'price_usd')
      const arsKey = getPendingKey(clientId, product.id, 'price_ars')
      const eurKey = getPendingKey(clientId, product.id, 'price_eur')
      const hasPending = usdKey in pendingPrices || arsKey in pendingPrices || eurKey in pendingPrices

      if (!hasPending) continue

      const existing = getPriceForClient(clientId, product.id)
      const newUsd = pendingPrices[usdKey] !== undefined
        ? (parseFloat(pendingPrices[usdKey]) || null)
        : (existing?.price_usd ?? null)
      const newArs = pendingPrices[arsKey] !== undefined
        ? (parseFloat(pendingPrices[arsKey]) || null)
        : (existing?.price_ars ?? null)
      const newEur = pendingPrices[eurKey] !== undefined
        ? (parseFloat(pendingPrices[eurKey]) || null)
        : (existing?.price_eur ?? null)

      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          product_id: product.id,
          price_usd: newUsd,
          price_ars: newArs,
          price_eur: newEur,
        }),
      })
      const { price } = await res.json()
      if (price) {
        setAllPrices(prev => {
          const idx = prev.findIndex(p => p.client_id === clientId && p.product_id === product.id)
          if (idx >= 0) return prev.map((p, i) => i === idx ? price : p)
          return [...prev, price]
        })
      }
    }

    // Clear pending prices for this client
    setPendingPrices(prev => {
      const next = { ...prev }
      products.forEach(p => {
        delete next[getPendingKey(clientId, p.id, 'price_usd')]
        delete next[getPendingKey(clientId, p.id, 'price_ars')]
        delete next[getPendingKey(clientId, p.id, 'price_eur')]
      })
      return next
    })

    setSaving(null)
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Se borran todos sus pedidos y precios.`)) return
    setDeletingId(id)
    await fetch('/api/admin/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setClients(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  async function createClient_() {
    if (!newClient?.name || !newClient?.email || !newClient?.password) return
    setSavingClient(true)
    setCreateError('')
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newClient.name,
        email: newClient.email,
        password: newClient.password,
        company: newClient.company || null,
        country: newClient.country || '',
        currency: newClient.currency || 'USD',
        notes: newClient.notes || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setCreateError(json.error ?? 'Error al crear el cliente.')
      setSavingClient(false)
      return
    }
    setClients(prev => [...prev, json.client])
    setNewClient(null)
    setCreateError('')
    setSavingClient(false)
  }

  function startEditClient(client: Client) {
    setEditingClientId(client.id)
    setEditForm({ name: client.name, email: client.email, company: client.company ?? '', country: client.country, currency: client.currency, notes: client.notes ?? '', newPassword: '' })
    setEditError('')
  }

  async function saveEditClient(clientId: string) {
    setSavingEdit(true)
    setEditError('')
    const body: Record<string, unknown> = {
      name: editForm.name,
      email: editForm.email,
      company: editForm.company || null,
      country: editForm.country,
      currency: editForm.currency,
      notes: editForm.notes || null,
    }
    if (editForm.newPassword) body.password = editForm.newPassword
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setEditError(json.error ?? 'Error al guardar.'); setSavingEdit(false); return }
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...json.client } : c))
    setEditingClientId(null)
    setSavingEdit(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>
  }

  return (
    <div className="min-h-screen">
      <NavBar client={adminClient} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D4535]">Clientes Mayoristas</h1>
            <p className="text-sm text-[#2D4535]/60 mt-1">{clients.filter(c => !c.is_admin).length} clientes</p>
          </div>
          <button
            onClick={() => setNewClient({ currency: 'USD' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] transition-colors"
          >
            <Plus size={16} />
            Nuevo cliente
          </button>
        </div>

        {/* New client form */}
        {newClient && (
          <div className="bg-white rounded-2xl border border-[#B8935A]/30 p-5 mb-5 space-y-3">
            <h3 className="font-medium text-[#2D4535]">Nuevo cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Nombre *</label>
                <input value={newClient.name ?? ''} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
                  placeholder="Juan García" className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Email *</label>
                <input type="email" value={newClient.email ?? ''} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))}
                  placeholder="juan@empresa.com" className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Contraseña *</label>
                <input type="text" value={(newClient as NewClientForm).password ?? ''} onChange={e => setNewClient(p => ({ ...p, password: e.target.value }))}
                  placeholder="Ej: Tabare.2024" className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Empresa</label>
                <input value={newClient.company ?? ''} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))}
                  placeholder="Jardín del Mate" className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">País</label>
                <input value={newClient.country ?? ''} onChange={e => setNewClient(p => ({ ...p, country: e.target.value }))}
                  placeholder="España" className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Moneda</label>
                <select value={newClient.currency ?? 'USD'} onChange={e => setNewClient(p => ({ ...p, currency: e.target.value as 'USD' | 'ARS' | 'EUR' }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] bg-white">
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            {createError && <p className="text-red-600 text-sm">{createError}</p>}
            <div className="flex gap-2">
              <button onClick={createClient_} disabled={savingClient || !newClient.name || !newClient.email || !(newClient as NewClientForm).password}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
                <Save size={14} />
                {savingClient ? 'Guardando...' : 'Crear cliente'}
              </button>
              <button onClick={() => { setNewClient(null); setCreateError('') }}
                className="px-4 py-2 rounded-xl border border-[#2D4535]/20 text-[#2D4535] text-sm hover:bg-[#2D4535]/5 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Clients list */}
        <div className="space-y-3">
          {clients.filter(c => !c.is_admin).map(client => {
            const isExpanded = expandedId === client.id
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-[#2D4535]/10 overflow-hidden">
                <button
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#2D4535]/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#2D4535]">{client.name}</span>
                      {client.company && <span className="text-xs text-[#2D4535]/40">· {client.company}</span>}
                      {!client.active && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactivo</span>}
                    </div>
                    <p className="text-xs text-[#2D4535]/50 mt-0.5">{client.email} · {client.country} · {client.currency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); deleteClient(client.id, client.name) }}
                      disabled={deletingId === client.id}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="text-[#2D4535]/40">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#2D4535]/10 px-5 py-4 bg-[#F0E8D8]/30">

                    {/* Edit client data */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-[#2D4535]">Datos del cliente</h4>
                        {editingClientId !== client.id && (
                          <button onClick={() => startEditClient(client)}
                            className="flex items-center gap-1 text-xs text-[#2D4535]/50 hover:text-[#2D4535] transition-colors">
                            <Pencil size={12} /> Editar datos
                          </button>
                        )}
                      </div>

                      {editingClientId === client.id ? (
                        <div className="bg-white rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">Nombre</label>
                              <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
                            </div>
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">Email</label>
                              <input type="email" value={editForm.email ?? ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
                            </div>
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">Nueva contraseña (dejar vacío para no cambiar)</label>
                              <input type="text" value={editForm.newPassword ?? ''} onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                                placeholder="Nueva contraseña..."
                                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
                            </div>
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">Empresa</label>
                              <input value={editForm.company ?? ''} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
                            </div>
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">País</label>
                              <input value={editForm.country ?? ''} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
                            </div>
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">Moneda</label>
                              <select value={editForm.currency ?? 'USD'} onChange={e => setEditForm(f => ({ ...f, currency: e.target.value as 'USD' | 'ARS' | 'EUR' }))}
                                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] bg-white">
                                <option value="USD">USD</option>
                                <option value="ARS">ARS</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-[#2D4535]/60 block mb-1">Notas internas</label>
                            <textarea value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] resize-none" />
                          </div>
                          {editError && <p className="text-red-600 text-sm">{editError}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => saveEditClient(client.id)} disabled={savingEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D4535] text-[#F0E8D8] text-xs hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
                              <Save size={12} /> {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <button onClick={() => setEditingClientId(null)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#2D4535]/20 text-[#2D4535] text-xs hover:bg-[#2D4535]/5 transition-colors">
                              <X size={12} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#2D4535]/50 space-y-0.5">
                          <p><span className="text-[#2D4535]/40">Email:</span> {client.email}</p>
                          {client.company && <p><span className="text-[#2D4535]/40">Empresa:</span> {client.company}</p>}
                          {client.country && <p><span className="text-[#2D4535]/40">País:</span> {client.country}</p>}
                          {client.notes && <p><span className="text-[#2D4535]/40">Notas:</span> {client.notes}</p>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-[#2D4535]">Precios por producto</h4>
                      <button
                        onClick={() => savePricesForClient(client.id)}
                        disabled={saving === client.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D4535] text-[#F0E8D8] text-xs hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
                      >
                        <Save size={12} />
                        {saving === client.id ? 'Guardando...' : 'Guardar precios'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs font-medium text-[#2D4535]/50 px-1">
                        <span>Producto</span>
                        <span className="w-24 text-right">USD</span>
                        <span className="w-24 text-right">ARS</span>
                        <span className="w-24 text-right">EUR</span>
                      </div>
                      {products.map(product => (
                        <div key={product.id}
                             className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-white rounded-xl px-3 py-2">
                          <div>
                            <span className="text-sm text-[#2D4535]">{product.name}</span>
                            <span className="text-xs text-[#2D4535]/40 ml-2 font-mono">{product.code}</span>
                          </div>
                          <input
                            type="number" step="0.01" placeholder="—"
                            value={getDisplayPrice(client.id, product.id, 'price_usd')}
                            onChange={e => handlePriceChange(client.id, product.id, 'price_usd', e.target.value)}
                            className="w-24 text-right px-2 py-1 rounded-lg border border-[#2D4535]/10 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                          />
                          <input
                            type="number" step="0.01" placeholder="—"
                            value={getDisplayPrice(client.id, product.id, 'price_ars')}
                            onChange={e => handlePriceChange(client.id, product.id, 'price_ars', e.target.value)}
                            className="w-24 text-right px-2 py-1 rounded-lg border border-[#2D4535]/10 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                          />
                          <input
                            type="number" step="0.01" placeholder="—"
                            value={getDisplayPrice(client.id, product.id, 'price_eur')}
                            onChange={e => handlePriceChange(client.id, product.id, 'price_eur', e.target.value)}
                            className="w-24 text-right px-2 py-1 rounded-lg border border-[#2D4535]/10 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
