
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

// Types matching Prisma
type ModuleType = 'PERSONAL' | 'EDUCATION' | 'BUSINESS' | 'HEALTH' | 'TRAVEL' | null

interface Requirement {
    id: string
    country: string
    processType: string
    documentType: string
    isRequired: boolean
    description?: string
    module: ModuleType
}

export default function RequirementsSettingsPage() {
    const [requirements, setRequirements] = useState<Requirement[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Filters
    const [filterCountry, setFilterCountry] = useState('')
    const [filterProcess, setFilterProcess] = useState('')
    const [filterModule, setFilterModule] = useState<string>('ALL')

    // Form State
    const [formData, setFormData] = useState<Partial<Requirement>>({
        country: '',
        processType: '',
        documentType: '',
        isRequired: true,
        description: '',
        module: null
    })

    const fetchRequirements = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterCountry) params.append('country', filterCountry)
            if (filterProcess) params.append('processType', filterProcess)
            if (filterModule !== 'ALL') params.append('module', filterModule)

            const res = await fetch(`/api/admin/requirements?${params}`)
            const data = await res.json()
            if (data.success) {
                setRequirements(data.data)
            }
        } catch (error) {
            toast.error('Failed to load requirements')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequirements()
    }, [filterCountry, filterProcess, filterModule])

    const handleSubmit = async () => {
        if (!formData.country || !formData.processType || !formData.documentType) {
            toast.error('Missing required fields')
            return
        }

        try {
            const method = editingId ? 'PUT' : 'POST'
            const body = editingId ? { ...formData, id: editingId } : formData

            const res = await fetch('/api/admin/requirements', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (data.success) {
                toast.success(editingId ? 'Requirement updated' : 'Requirement created')
                setEditingId(null)
                setFormData({
                    country: filterCountry || '',
                    processType: filterProcess || '',
                    documentType: '',
                    isRequired: true,
                    description: '',
                    module: (filterModule !== 'ALL' ? filterModule as ModuleType : null)
                })
                fetchRequirements()
            } else {
                toast.error(data.error || 'Operation failed')
            }
        } catch (error) {
            toast.error('Network error')
        }
    }

    const startEdit = (req: Requirement) => {
        setEditingId(req.id)
        setFormData(req)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this requirement?')) return
        try {
            const res = await fetch(`/api/admin/requirements?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Deleted')
                fetchRequirements()
            }
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Document Requirements</h1>
                    <p className="text-gray-500">Configure required documents per country, process, and module.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingId ? 'Edit Configuration' : 'Add New Configuration'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Country</Label>
                                <Input
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="e.g. USA"
                                />
                            </div>
                            <div>
                                <Label>Process Type</Label>
                                <Select
                                    value={formData.processType}
                                    onValueChange={v => setFormData({ ...formData, processType: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TOURIST">Tourist</SelectItem>
                                        <SelectItem value="BUSINESS">Business</SelectItem>
                                        <SelectItem value="MEDICAL">Medical</SelectItem>
                                        <SelectItem value="STUDENT">Student</SelectItem>
                                        <SelectItem value="WORK">Work</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Module Scope</Label>
                                <Select
                                    value={formData.module || "GLOBAL"}
                                    onValueChange={v => setFormData({ ...formData, module: v === "GLOBAL" ? null : v as ModuleType })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Global (All Modules)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GLOBAL">Global (All Modules)</SelectItem>
                                        <SelectItem value="PERSONAL">Personal</SelectItem>
                                        <SelectItem value="EDUCATION">Education</SelectItem>
                                        <SelectItem value="BUSINESS">Business</SelectItem>
                                        <SelectItem value="HEALTH">Health</SelectItem>
                                        <SelectItem value="TRAVEL">Travel</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Global requirements apply to ALL applications. Module requirements only apply when that module is selected.
                                </p>
                            </div>
                            <div>
                                <Label>Document Name</Label>
                                <Input
                                    value={formData.documentType}
                                    onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                                    placeholder="e.g. Passport Copy"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="req"
                                    checked={formData.isRequired}
                                    onChange={e => setFormData({ ...formData, isRequired: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="req">Mandatory?</Label>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Button onClick={handleSubmit} className="w-full">
                                    {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {editingId ? 'Update' : 'Add Requirement'}
                                </Button>
                                {editingId && (
                                    <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}); }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Existing Configurations</CardTitle>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Filter Country..."
                                    className="h-8 max-w-[150px]"
                                    value={filterCountry}
                                    onChange={e => setFilterCountry(e.target.value)}
                                />
                                <Select value={filterModule} onValueChange={setFilterModule}>
                                    <SelectTrigger className="h-8 max-w-[150px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Modules</SelectItem>
                                        <SelectItem value="null">Global Only</SelectItem>
                                        <SelectItem value="PERSONAL">Personal</SelectItem>
                                        <SelectItem value="EDUCATION">Education</SelectItem>
                                        <SelectItem value="BUSINESS">Business</SelectItem>
                                        <SelectItem value="HEALTH">Health</SelectItem>
                                        <SelectItem value="TRAVEL">Travel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : requirements.length === 0 ? (
                                <div className="text-center p-8 text-gray-500">No requirements found.</div>
                            ) : (
                                <div className="space-y-2">
                                    {requirements.map(req => (
                                        <div key={req.id} className="flex justify-between items-center p-3 border rounded bg-white hover:bg-gray-50">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">{req.documentType}</span>
                                                    {req.isRequired && <Badge variant="destructive" className="text-[10px] h-4">Required</Badge>}
                                                    {req.module ? (
                                                        <Badge variant="outline" className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200">
                                                            {req.module}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] h-4">Global</Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {req.country} • {req.processType}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(req)}>
                                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(req.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
