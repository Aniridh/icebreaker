/**
 * Dashboard Page
 * Main dashboard for the Networking Co-Pilot system
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Plus,
  Search,
  Filter,
  BarChart3,
  UserPlus,
  Camera
} from 'lucide-react'
import { ContactCard } from '../components/ContactCard'
import { Contact } from '../../lib/services/contactService'
import { toast } from 'sonner'


interface DashboardStats {
  totalContacts: number
  contactsByRelationship: Record<string, number>
  contactsBySource: Record<string, number>
  recentInteractions: number
  upcomingMeetings: number
  followUpsNeeded: number
  topIndustries: Array<{ industry: string; count: number }>
  topCompanies: Array<{ company: string; count: number }>
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showAddContact, setShowAddContact] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load contacts
      const contactsResponse = await fetch('/api/contacts')
      const contactsData = await contactsResponse.json()
      
      if (contactsData.success) {
        setContacts(contactsData.data)
      }
      
      // Load analytics
      const analyticsResponse = await fetch('/api/contacts/analytics/overview')
      const analyticsData = await analyticsResponse.json()
      
      if (analyticsData.success) {
        setStats(analyticsData.data)
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.title?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || contact.relationship === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  const recentContacts = contacts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const followUpContacts = contacts.filter(contact => 
    contact.nextFollowUpAt && new Date(contact.nextFollowUpAt) <= new Date()
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your networking dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Networking Co-Pilot</h1>
              <p className="text-sm text-gray-600">Your intelligent networking assistant</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddContact(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Contact
              </button>
              
              <button 
                onClick={() => navigate('/scanner')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Business Card
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Interactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentInteractions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Meetings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingMeetings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Follow-ups Needed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.followUpsNeeded}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Alerts */}
        {followUpContacts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-800">Follow-ups Needed</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followUpContacts.slice(0, 3).map(contact => (
                <div key={contact.id} className="bg-white rounded p-3 border border-yellow-200">
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.company}</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Due: {new Date(contact.nextFollowUpAt!).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Contacts</option>
                    <option value="prospect">Prospects</option>
                    <option value="contact">Contacts</option>
                    <option value="connection">Connections</option>
                    <option value="close_contact">Close Contacts</option>
                    <option value="mentor">Mentors</option>
                    <option value="mentee">Mentees</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contacts Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Contacts ({filteredContacts.length})
                </h2>
              </div>
              
              {filteredContacts.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || selectedFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Start building your network by adding your first contact'
                    }
                  </p>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredContacts.map(contact => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      showActions={true}
                      onClick={() => {
                        // Navigate to contact detail
                        console.log('Navigate to contact:', contact.id)
                      }}
                      onEdit={() => {
                        // Open edit modal
                        console.log('Edit contact:', contact.id)
                      }}
                      onDelete={() => {
                        // Confirm and delete
                        console.log('Delete contact:', contact.id)
                      }}
                      onMessage={() => {
                        // Open messaging
                        console.log('Message contact:', contact.id)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contacts</h3>
              <div className="space-y-3">
                {recentContacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Industries */}
            {stats && stats.topIndustries.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Industries</h3>
                <div className="space-y-3">
                  {stats.topIndustries.map((industry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{industry.industry}</span>
                      <span className="text-sm font-medium text-gray-900">{industry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  View Analytics
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center">
                  <Calendar className="w-4 h-4 mr-3" />
                  Schedule Meeting
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center">
                  <TrendingUp className="w-4 h-4 mr-3" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}