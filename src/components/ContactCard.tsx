/**
 * Contact Card Component
 * Displays contact information in a card format
 */
import React from 'react'
import { User, Building2, MapPin, Calendar, MessageCircle, Phone, Mail } from 'lucide-react'
import { Contact } from '../../api/services/contactService'

interface ContactCardProps {
  contact: Contact
  onClick?: () => void
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onMessage?: () => void
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
  onMessage
}) => {
  const getRelationshipColor = (relationship: Contact['relationship']) => {
    const colors = {
      prospect: 'bg-gray-100 text-gray-800',
      contact: 'bg-blue-100 text-blue-800',
      connection: 'bg-green-100 text-green-800',
      close_contact: 'bg-purple-100 text-purple-800',
      mentor: 'bg-orange-100 text-orange-800',
      mentee: 'bg-pink-100 text-pink-800'
    }
    return colors[relationship] || colors.contact
  }

  const getSourceIcon = (source: Contact['source']) => {
    switch (source) {
      case 'linkedin':
        return '💼'
      case 'business_card':
        return '📇'
      case 'event':
        return '🎪'
      case 'referral':
        return '🤝'
      default:
        return '👤'
    }
  }

  const formatLastContact = (date?: string) => {
    if (!date) return 'Never'
    const lastContact = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastContact.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {contact.profilePicture ? (
            <img
              src={contact.profilePicture}
              alt={contact.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
            {contact.title && (
              <p className="text-sm text-gray-600">{contact.title}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getSourceIcon(contact.source)}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(contact.relationship)}`}>
            {contact.relationship.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Company & Location */}
      <div className="space-y-2 mb-4">
        {contact.company && (
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="w-4 h-4 mr-2" />
            <span>{contact.company}</span>
            {contact.industry && (
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                {contact.industry}
              </span>
            )}
          </div>
        )}
        
        {contact.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{contact.location}</span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
        {contact.email && (
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-1" />
            <span className="truncate max-w-32">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center">
            <Phone className="w-4 h-4 mr-1" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {contact.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">
              +{contact.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Notes Preview */}
      {contact.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {contact.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          <span>Last contact: {formatLastContact(contact.lastContactedAt)}</span>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            {onMessage && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMessage()
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Send message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Follow-up Alert */}
      {contact.nextFollowUpAt && new Date(contact.nextFollowUpAt) <= new Date() && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <span className="text-yellow-800 font-medium">⏰ Follow-up needed</span>
        </div>
      )}
    </div>
  )
}