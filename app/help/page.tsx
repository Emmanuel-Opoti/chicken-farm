'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'

const FAQ: Record<string, { q: string; a: string }[]> = {
  'Daily Log': [
    { q: 'Why can I not save my eggs?', a: 'You must select a Flock and a Date at the top of the Daily Log page before saving. Both fields are required.' },
    { q: 'How do I enter eggs?', a: 'Tap "Eggs Collected", enter the total number of eggs in the box. The app will automatically calculate how many trays and loose eggs that is (1 tray = 12 eggs). Also enter any broken eggs.' },
    { q: 'How do I log feed?', a: 'Tap "Feed Used", select the feed type from the dropdown (Chick Mash, Grower Mash, or Layer Mash), then enter the quantity in kg. The app shows you the estimated cost based on the current price.' },
    { q: 'How do I log water?', a: 'Tap the "Water" section and enter the number of litres given to the flock for that day.' },
    { q: 'Can I log data for a past date?', a: 'Yes. Change the Date field at the top to any past date before saving.' },
    { q: 'How do I correct a wrong daily entry?', a: 'Select the flock and the date of the wrong entry. Your saved records for that day will appear below the forms. Tap "Edit" next to the record to change the values, or "Delete" to remove it entirely.' },
  ],
  'Dashboard': [
    { q: 'What are the cards on the dashboard?', a: 'The four cards show: Eggs collected today, Feed cost today (in KES), Total number of birds across all active flocks, and Total revenue earned this month.' },
    { q: 'I see a yellow price review warning. What do I do?', a: 'This means one or more input prices (feed or vaccine) have not been updated in over 30 days. Go to Registry, tap "Inputs & Prices", and tap "Update price" next to each item to enter the current price.' },
    { q: 'I see a red vaccination overdue warning. What do I do?', a: 'One or more vaccinations are past their scheduled date. Go to SOP and check the Vaccination tab to see what is due.' },
  ],
  'Registry': [
    { q: 'How do I add a new flock?', a: 'Go to Registry, tap "Flocks", then fill in the flock name, date you received the chicks, and number of chicks. Tap "Add Flock". This flock will then appear in the Daily Log dropdown.' },
    { q: 'How do I add a feed or vaccine to the registry?', a: 'Go to Registry, tap "Inputs & Prices", fill in the name, category (feed/vaccine/medicine), unit, and price, then tap "Add Input".' },
    { q: 'How do I update a price?', a: 'Go to Registry, tap "Inputs & Prices". Find the item and tap "Update price". A box will appear asking for the new price. Enter it and tap OK.' },
    { q: 'What does the amber warning on an input mean?', a: 'It means the price for that item has not been reviewed in over 30 days. Tap "Update price" to confirm or change the current price.' },
    { q: 'How do I delete a flock entered by mistake?', a: 'Go to Registry, tap "Flocks". Find the flock and tap "Delete". You will be asked to confirm before it is permanently removed. To simply retire a flock that has finished laying, use "Deactivate" instead — this keeps its history.' },
  ],
  'Sales': [
    { q: 'How do I record a sale to a client?', a: 'Go to Sales, tap "Client Sale". Select the client from the dropdown, enter the date, number of eggs sold, price per egg, and delivery cost. The total will be shown before you save.' },
    { q: 'How do I record a small sale (less than a tray)?', a: 'Go to Sales, tap "Ad-hoc Sale". Enter the date, number of eggs (1 to 11), and price per egg. This does not need a client name.' },
    { q: 'How do I mark a client as paid?', a: 'Go to Sales, tap "History", find the sale under "Client Sales" and tap "Mark paid".' },
    { q: 'What if a client is not in the dropdown?', a: 'You need to add them first. Go to Clients, fill in their details and tap "Add Client". They will then appear in the Sales dropdown.' },
    { q: 'How do I edit or delete a wrong sale?', a: 'Go to Sales, tap "History". Find the sale and tap "Edit" to correct the eggs, price, or delivery cost, or tap "Delete" to remove it. Both client sales and ad-hoc sales can be edited or deleted.' },
  ],
  'Clients': [
    { q: 'How do I add a client?', a: 'Go to Clients, fill in the name, phone number, location, and their standard delivery cost. Tap "Add Client".' },
    { q: 'How do I remove a client?', a: 'You cannot delete a client but you can deactivate them. Find the client and tap "Deactivate". They will no longer appear in the sales dropdown but their history is kept.' },
  ],
  'Calendar': [
    { q: 'How do I use the calendar?', a: 'Go to Calendar. You will see the current month. Days that have data will show egg count and feed cost. Tap any day to see the full details for that day.' },
    { q: 'How do I go to a different month?', a: 'Tap the left arrow to go back one month, or the right arrow to go forward. Tap "Today" to return to the current month.' },
  ],
  'Analytics': [
    { q: 'What do the charts show?', a: 'There are three charts: (1) Daily egg count over time, (2) Revenue vs Feed Cost as bars - green is money in, red is money out, (3) A scatter chart showing the relationship between feed cost and egg output.' },
    { q: 'How do I change the time period?', a: 'Tap the buttons labelled 7d, 30d, or 90d at the top to see the last 7, 30, or 90 days of data.' },
  ],
  'Reports': [
    { q: 'Where are the reports?', a: 'Go to Reports. You will see six automatic reports: This Week, Last Week, This Month, Last Month, This Year, and Last Year.' },
    { q: 'What does each report show?', a: 'Each report shows: Total eggs collected, Feed cost, Vaccine cost, Client sales revenue, Ad-hoc sales revenue, Total revenue, and Net profit (revenue minus costs).' },
  ],
  'SOP': [
    { q: 'What is the SOP page?', a: 'SOP stands for Standard Operating Procedures. It contains the full Kenchic Layer vaccination and feeding guide from when the chicks arrive until they are laying.' },
    { q: 'How do I generate a vaccination schedule for my flock?', a: 'Go to SOP, tap "Vaccination", select your flock from the dropdown, and tap "Generate Schedule". The app will calculate all vaccination dates based on the date the chicks were received.' },
    { q: 'What feed should I use at each stage?', a: 'Weeks 1-8: Chick Mash. Weeks 9-18: Grower Mash. Week 19 onwards: Layer Mash. You can find the full details and daily feed rates on the SOP Feeding tab.' },
  ],
}

const ALL_KEYWORDS: { keyword: string; section: string; q: string; a: string }[] = []
Object.entries(FAQ).forEach(([section, items]) => {
  items.forEach(item => {
    ALL_KEYWORDS.push({ keyword: item.q.toLowerCase(), section, ...item })
    ALL_KEYWORDS.push({ keyword: item.a.toLowerCase(), section, ...item })
  })
})

function search(query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const seen = new Set<string>()
  return ALL_KEYWORDS.filter(item => {
    if (item.keyword.includes(q) && !seen.has(item.q)) {
      seen.add(item.q)
      return true
    }
    return false
  })
}

export default function Help() {
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeQ, setActiveQ] = useState<string | null>(null)

  const results = query.length > 1 ? search(query) : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Help & Onboarding</h1>
      <p className="text-gray-500 text-sm mb-6">Ask a question or browse by section</p>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveSection(null) }}
          placeholder="Type your question e.g. how do I add a client..."
          className="w-full border-2 border-green-300 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-green-600"
        />
      </div>

      {/* Search results */}
      {query.length > 1 && (
        <div className="mb-6 space-y-3">
          {results.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-5 text-gray-500 text-center">
              No results found. Try different words or browse the sections below.
            </div>
          ) : results.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1">{r.section}</p>
              <p className="font-semibold text-gray-900 mb-2">{r.q}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{r.a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Section browse */}
      {!query && (
        <>
          <p className="text-sm font-medium text-gray-500 mb-3">Browse by section</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {Object.keys(FAQ).map(section => (
              <button key={section} onClick={() => setActiveSection(activeSection === section ? null : section)}
                className={`rounded-2xl p-4 text-left border transition-colors ${activeSection === section ? 'bg-green-700 text-white border-green-700' : 'bg-white border-gray-100 text-gray-700 hover:border-green-300'}`}>
                <p className="font-semibold text-sm">{section}</p>
                <p className={`text-xs mt-0.5 ${activeSection === section ? 'text-green-200' : 'text-gray-400'}`}>
                  {FAQ[section].length} questions
                </p>
              </button>
            ))}
          </div>

          {activeSection && (
            <div className="space-y-3">
              {FAQ[activeSection].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setActiveQ(activeQ === item.q ? null : item.q)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm pr-4">{item.q}</p>
                    <span className="text-green-700 text-lg shrink-0">{activeQ === item.q ? '−' : '+'}</span>
                  </button>
                  {activeQ === item.q && (
                    <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick start guide */}
      {!query && !activeSection && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
          <h2 className="font-bold text-green-900 mb-3">Getting Started</h2>
          <ol className="space-y-2 text-sm text-green-800">
            <li><span className="font-bold">1.</span> Go to <strong>Registry</strong> and add your flock (number of birds, date received)</li>
            <li><span className="font-bold">2.</span> In Registry, check <strong>Inputs & Prices</strong> - your feeds and vaccines are already listed</li>
            <li><span className="font-bold">3.</span> Go to <strong>SOP</strong>, select your flock, and tap <strong>Generate Schedule</strong> to set up vaccinations</li>
            <li><span className="font-bold">4.</span> Go to <strong>Clients</strong> and add the people you sell eggs to</li>
            <li><span className="font-bold">5.</span> Every morning, go to <strong>Daily Log</strong> and record eggs, feed, and water</li>
            <li><span className="font-bold">6.</span> When you sell eggs, go to <strong>Sales</strong> to record it</li>
            <li><span className="font-bold">7.</span> Check <strong>Reports</strong> at the end of each week to see how the farm is doing</li>
          </ol>
        </div>
      )}
    </div>
  )
}
