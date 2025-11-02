import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, X, AlertCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: 'Meeting' | 'Training' | 'Holiday' | 'Company Event' | 'Deadline';
  date: string;
  time: string;
  location: string;
  attendees: number;
  description: string;
  organizer: string;
}

interface EventsModalProps {
  onClose?: () => void;
}

const EventsModal: React.FC<EventsModalProps> = ({ onClose }) => {
  const [filterType, setFilterType] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'Meeting' as Event['type'],
    date: '',
    time: '',
    location: '',
    attendees: '',
    description: '',
    organizer: ''
  });
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'All-Hands Meeting',
      type: 'Meeting',
      date: '2025-01-15',
      time: '10:00 AM',
      location: 'Conference Room A',
      attendees: 45,
      description: 'Monthly company-wide meeting to discuss Q1 goals and updates.',
      organizer: 'Sarah Johnson'
    },
    {
      id: '2',
      title: 'New Employee Orientation',
      type: 'Training',
      date: '2025-01-18',
      time: '9:00 AM',
      location: 'Training Room B',
      attendees: 8,
      description: 'Orientation session for new hires joining this month.',
      organizer: 'Emma Wilson'
    },
    {
      id: '3',
      title: 'Martin Luther King Jr. Day',
      type: 'Holiday',
      date: '2025-01-20',
      time: 'All Day',
      location: 'Company-wide',
      attendees: 247,
      description: 'Federal holiday - offices closed.',
      organizer: 'HR Department'
    },
    {
      id: '4',
      title: 'Q4 Performance Reviews Due',
      type: 'Deadline',
      date: '2025-01-25',
      time: '5:00 PM',
      location: 'HR System',
      attendees: 12,
      description: 'Final deadline for submitting Q4 performance reviews.',
      organizer: 'HR Department'
    },
    {
      id: '5',
      title: 'Team Building Workshop',
      type: 'Company Event',
      date: '2025-01-28',
      time: '2:00 PM',
      location: 'Main Auditorium',
      attendees: 35,
      description: 'Interactive workshop focused on team collaboration and communication.',
      organizer: 'Mike Chen'
    }
  ]);
  const [showCalendarPermission, setShowCalendarPermission] = useState(false);
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState<Event | null>(null);

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const filteredEvents = events.filter(event => 
    filterType === 'All' || event.type === filterType
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Meeting': return 'bg-blue-100 text-blue-800';
      case 'Training': return 'bg-green-100 text-green-800';
      case 'Holiday': return 'bg-purple-100 text-purple-800';
      case 'Company Event': return 'bg-yellow-100 text-yellow-800';
      case 'Deadline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert('Please fill in all required fields');
      return;
    }

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      attendees: parseInt(newEvent.attendees) || 1,
      description: newEvent.description,
      organizer: newEvent.organizer || 'Current User'
    };

    setEvents(prev => [...prev, event]);
    setNewEvent({
      title: '',
      type: 'Meeting',
      date: '',
      time: '',
      location: '',
      attendees: '',
      description: '',
      organizer: ''
    });
    setShowCreateEvent(false);
  };

  const handleAddToCalendar = (event: Event) => {
    setPendingCalendarEvent(event);
    setShowCalendarPermission(true);
  };

  const handleCalendarPermissionGranted = (calendarType: 'google' | 'outlook') => {
    if (!pendingCalendarEvent) return;

    try {
      const eventDate = new Date(pendingCalendarEvent.date);
      const eventTitle = encodeURIComponent(pendingCalendarEvent.title);
      const eventDescription = encodeURIComponent(pendingCalendarEvent.description);
      const eventLocation = encodeURIComponent(pendingCalendarEvent.location);
      
      // Format date for calendar (YYYYMMDD format)
      const dateStr = eventDate.toISOString().slice(0, 10).replace(/-/g, '');
      
      let calendarUrl = '';
      
      if (calendarType === 'google') {
        if (pendingCalendarEvent.time === 'All Day') {
          calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${dateStr}/${dateStr}&details=${eventDescription}&location=${eventLocation}`;
        } else {
          const timeStr = pendingCalendarEvent.time.replace(/[^\d:]/g, '').replace(':', '') + '00';
          const startDateTime = `${dateStr}T${timeStr}`;
          const endDateTime = `${dateStr}T${(parseInt(timeStr.slice(0, 2)) + 2).toString().padStart(2, '0')}${timeStr.slice(2)}`;
          calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDateTime}/${endDateTime}&details=${eventDescription}&location=${eventLocation}`;
        }
      } else {
        calendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${eventTitle}&body=${eventDescription}&location=${eventLocation}`;
      }
      
      window.open(calendarUrl, '_blank');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      alert('Error creating calendar event. Please try again.');
    }

    setShowCalendarPermission(false);
    setPendingCalendarEvent(null);
  };

  const handleCalendarPermissionDenied = () => {
    setShowCalendarPermission(false);
    setPendingCalendarEvent(null);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Company Events</h2>
            <p className="text-gray-600 dark:text-gray-400">{events.length} upcoming events and meetings</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Meeting">Meetings</option>
              <option value="Training">Training</option>
              <option value="Holiday">Holidays</option>
              <option value="Company Event">Company Events</option>
              <option value="Deadline">Deadlines</option>
            </select>
            <button 
              onClick={() => setShowCreateEvent(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-emerald-600 rounded-full p-2">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(event.date).toLocaleDateString()} at {event.time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {event.attendees} attendees
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">by {event.organizer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredEvents.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No events found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white dark:text-white">{selectedEvent.title}</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getTypeColor(selectedEvent.type)}`}>
                  {selectedEvent.type}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600 dark:text-gray-400">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedEvent.time}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEvent.location}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium">Attendees</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEvent.attendees} people</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Description</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
              </div>
              
              <div>
                <p className="font-medium">Organizer</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedEvent.organizer}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowEditEvent(true);
                  setNewEvent({
                    title: selectedEvent.title,
                    type: selectedEvent.type,
                    date: selectedEvent.date,
                    time: selectedEvent.time,
                    location: selectedEvent.location,
                    attendees: selectedEvent.attendees.toString(),
                    description: selectedEvent.description,
                    organizer: selectedEvent.organizer
                  });
                }}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit Event
              </button>
              <button 
                onClick={() => handleAddToCalendar(selectedEvent)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Create New Event</h3>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Team Building Workshop"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Event Type *</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as Event['type'] })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Training">Training</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Company Event">Company Event</option>
                    <option value="Deadline">Deadline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Time *</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Conference Room A, Zoom, Main Auditorium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Organizer</label>
                <input
                  type="text"
                  value={newEvent.organizer}
                  onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name or department"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the event, agenda, or purpose..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateEvent(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEvent && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Edit Event</h3>
              <button
                onClick={() => {
                  setShowEditEvent(false);
                  setNewEvent({
                    title: '',
                    type: 'Meeting',
                    date: '',
                    time: '',
                    location: '',
                    attendees: '',
                    description: '',
                    organizer: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Team Building Workshop"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Event Type *</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as Event['type'] })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Training">Training</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Company Event">Company Event</option>
                    <option value="Deadline">Deadline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Time *</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Conference Room A, Zoom, Main Auditorium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Organizer</label>
                <input
                  type="text"
                  value={newEvent.organizer}
                  onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name or department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the event, agenda, or purpose..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditEvent(false);
                  setNewEvent({
                    title: '',
                    type: 'Meeting',
                    date: '',
                    time: '',
                    location: '',
                    attendees: '',
                    description: '',
                    organizer: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Update the existing event
                  setEvents(events.map(e =>
                    e.id === selectedEvent.id
                      ? {
                          ...e,
                          title: newEvent.title,
                          type: newEvent.type,
                          date: newEvent.date,
                          time: newEvent.time,
                          location: newEvent.location,
                          attendees: parseInt(newEvent.attendees) || 0,
                          description: newEvent.description,
                          organizer: newEvent.organizer
                        }
                      : e
                  ));
                  setShowEditEvent(false);
                  setSelectedEvent(null);
                  setNewEvent({
                    title: '',
                    type: 'Meeting',
                    date: '',
                    time: '',
                    location: '',
                    attendees: '',
                    description: '',
                    organizer: ''
                  });
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Permission Modal */}
      {showCalendarPermission && pendingCalendarEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Add to Calendar</h3>
              <button
                onClick={handleCalendarPermissionDenied}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Event: {pendingCalendarEvent.title}</h4>
                <p className="text-blue-800 text-sm">
                  📅 {new Date(pendingCalendarEvent.date).toLocaleDateString()} at {pendingCalendarEvent.time}
                </p>
                <p className="text-blue-800 text-sm">
                  📍 {pendingCalendarEvent.location}
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">External Calendar Access</h4>
                    <p className="text-yellow-800 text-sm">
                      This will open an external calendar service in a new tab to add this event. 
                      Choose your preferred calendar application:
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCalendarPermissionGranted('google')}
                  className="w-full flex items-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 dark:bg-blue-900/20 hover:border-blue-300 transition-all"
                >
                  <div className="bg-blue-600 rounded-full p-2 mr-4">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">Google Calendar</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add to your Google Calendar</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCalendarPermissionGranted('outlook')}
                  className="w-full flex items-center p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 dark:bg-orange-900/20 hover:border-orange-300 transition-all"
                >
                  <div className="bg-orange-600 rounded-full p-2 mr-4">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">Microsoft Outlook</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add to your Outlook Calendar</p>
                  </div>
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs">
                  <strong>🔒 Privacy Note:</strong> We will redirect you to the selected calendar service. 
                  No personal calendar data is accessed or stored by HRStudio360.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCalendarPermissionDenied}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventsModal;