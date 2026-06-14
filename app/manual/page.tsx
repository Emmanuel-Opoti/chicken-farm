'use client'
import { useState } from 'react'
import { format } from 'date-fns'

async function generateManual() {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W  = doc.internal.pageSize.getWidth()   // 210
  const H  = doc.internal.pageSize.getHeight()  // 297
  const M  = 20           // margin
  const CW = W - M * 2   // content width = 170
  let y    = 0
  let pageNum    = 0
  let firstPage  = true   // track whether we need doc.addPage()

  const GREEN  = [21, 128, 61]   as [number, number, number]
  const LGREEN = [240, 249, 244] as [number, number, number]
  const DARK   = [30, 30, 30]    as [number, number, number]
  const GRAY   = [110, 110, 110] as [number, number, number]
  const AMBER  = [130, 80, 0]    as [number, number, number]

  // ── page management ───────────────────────────────────────────────────────

  function addPage(skipHeader = false) {
    pageNum++
    if (!firstPage) doc.addPage()
    firstPage = false
    y = M
    if (!skipHeader && pageNum > 1) {
      doc.setFillColor(...GREEN)
      doc.rect(0, 0, W, 11, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7.5)
      doc.setFont('times', 'bold')
      doc.text('WANDERA', M, 7.5)
      doc.setFont('helvetica', 'normal')
      doc.text('Chicken Business — User Manual', W / 2, 7.5, { align: 'center' })
      doc.text(`Page ${pageNum}`, W - M, 7.5, { align: 'right' })
      y = 19
    }
  }

  function guard(needed: number) {
    if (y + needed > H - 18) addPage()
  }

  function sp(n = 5) { y += n }

  // ── text primitives ───────────────────────────────────────────────────────

  function chapterHead(label: string) {
    guard(22)
    doc.setFillColor(...GREEN)
    doc.roundedRect(M, y, CW, 15, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('times', 'bold')
    doc.text(label, M + 6, y + 10.5)
    y += 21
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'normal')
  }

  function subHead(label: string) {
    guard(14)
    sp(2)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GREEN)
    doc.text(label, M, y)
    y += 7
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'normal')
  }

  function body(text: string, indent = 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    const lines = doc.splitTextToSize(text, CW - indent)
    guard(lines.length * 5.2 + 2)
    doc.text(lines, M + indent, y)
    y += lines.length * 5.2 + 2
  }

  function bullet(text: string, indent = 4) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    const lines = doc.splitTextToSize(text, CW - indent - 6)
    guard(lines.length * 5.2 + 2)
    doc.setFillColor(...GREEN)
    doc.circle(M + indent + 1.5, y - 1.2, 1.3, 'F')
    doc.text(lines, M + indent + 6, y)
    y += lines.length * 5.2 + 2
  }

  function step(num: number, text: string) {
    const lines = doc.splitTextToSize(text, CW - 14)
    guard(lines.length * 5.2 + 4)
    doc.setFillColor(...GREEN)
    doc.circle(M + 4.5, y - 1.5, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(String(num), M + 4.5, y + 0.8, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(lines, M + 12, y)
    y += lines.length * 5.2 + 4
  }

  function tip(text: string) {
    const lines = doc.splitTextToSize(text, CW - 12)
    const bh = lines.length * 5.2 + 10
    guard(bh + 4)
    doc.setFillColor(...LGREEN)
    doc.roundedRect(M, y, CW, bh, 3, 3, 'F')
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(0.8)
    doc.line(M + 3, y + 2, M + 3, y + bh - 2)
    doc.setLineWidth(0.2)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GREEN)
    doc.text('TIP', M + 8, y + 6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 70, 40)
    doc.setFontSize(9.5)
    doc.text(lines, M + 8, y + 12)
    y += bh + 5
    doc.setTextColor(...DARK)
  }

  function important(text: string) {
    const lines = doc.splitTextToSize(text, CW - 12)
    const bh = lines.length * 5.2 + 10
    guard(bh + 4)
    doc.setFillColor(255, 249, 235)
    doc.roundedRect(M, y, CW, bh, 3, 3, 'F')
    doc.setDrawColor(180, 120, 0)
    doc.setLineWidth(0.8)
    doc.line(M + 3, y + 2, M + 3, y + bh - 2)
    doc.setLineWidth(0.2)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...AMBER)
    doc.text('IMPORTANT', M + 8, y + 6.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.text(lines, M + 8, y + 12)
    y += bh + 5
    doc.setTextColor(...DARK)
  }

  // ── COVER PAGE ────────────────────────────────────────────────────────────
  addPage(true)   // pageNum = 1, no running header

  // Full-width green top
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, W, 105, 'F')

  // Decorative white arc (bottom of green band)
  doc.setFillColor(255, 255, 255)
  doc.ellipse(W / 2, 107, W / 2 + 10, 8, 'F')

  // Chicken silhouette — simple shapes, no opacity/GState calls
  doc.setFillColor(255, 255, 255)
  doc.ellipse(W / 2, 67, 20, 15, 'F')           // body
  doc.circle(W / 2 + 15, 52, 9, 'F')            // head
  doc.ellipse(W / 2 - 18, 62, 9, 6, 'F')        // tail
  doc.ellipse(W / 2 - 14, 57, 5, 3.5, 'F')      // tail top
  doc.setFillColor(255, 220, 60)
  doc.ellipse(W / 2 + 23, 53, 5, 3, 'F')        // beak
  doc.rect(W / 2 - 4, 80, 3, 9, 'F')            // left leg
  doc.rect(W / 2 + 4, 80, 3, 9, 'F')            // right leg
  doc.setFillColor(200, 35, 35)
  doc.ellipse(W / 2 + 14, 43.5, 3.5, 4.5, 'F') // comb
  doc.ellipse(W / 2 + 18, 42.5, 2.5, 3.5, 'F') // comb peak
  doc.ellipse(W / 2 + 22, 54.5, 2, 3.5, 'F')   // wattle
  doc.setFillColor(30, 90, 40)
  doc.circle(W / 2 + 17, 50.5, 1.5, 'F')        // eye

  // Farm name in the green band
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('times', 'bold')
  doc.text('WANDERA', W / 2, 91, { align: 'center' })
  doc.setFontSize(10.5)
  doc.setFont('times', 'normal')
  doc.text('RETIREMENT CHICKEN BUSINESS', W / 2, 100, { align: 'center' })

  // Title section (white area below green band)
  y = 124
  doc.setTextColor(...DARK)
  doc.setFontSize(28)
  doc.setFont('times', 'bold')
  doc.text('USER MANUAL', W / 2, y, { align: 'center' })

  y += 11
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text('Complete Step-by-Step Guide to Your Farm App', W / 2, y, { align: 'center' })

  y += 14
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(1.2)
  doc.line(M + 30, y, W - M - 30, y)
  doc.setLineWidth(0.2)

  y += 14
  doc.setFontSize(10.5)
  doc.setTextColor(70, 70, 70)
  const coverLines = [
    'This manual will walk you through every part of the app,',
    'one step at a time, with no technical jargon.',
    '',
    'Keep it nearby as you learn. There is no rush.',
    'Read one chapter, try it on the tablet, then move to the next.',
  ]
  coverLines.forEach(l => { doc.text(l, W / 2, y, { align: 'center' }); y += 8 })

  // Cover footer
  doc.setFillColor(...GREEN)
  doc.rect(0, H - 18, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Prepared for the Wandera family   |   ${format(new Date(), 'MMMM yyyy')}`, W / 2, H - 6, { align: 'center' })

  // ── TABLE OF CONTENTS ─────────────────────────────────────────────────────
  addPage()   // pageNum = 2
  chapterHead('Table of Contents')

  const toc = [
    ['1',  'Getting Started — First Time Setup'],
    ['2',  'Dashboard — Your Farm at a Glance'],
    ['3',  'Daily Log — Recording Each Day'],
    ['4',  'Mortality — Recording Bird Deaths'],
    ['5',  'Calendar — Looking Back at Past Days'],
    ['6',  'Analytics — Charts and Trends'],
    ['7',  'Clients — Managing Your Egg Buyers'],
    ['8',  'Sales — Recording Every Egg Sale'],
    ['9',  'Registry — Flocks and Input Prices'],
    ['10', 'Reports — Summaries and PDF Export'],
    ['11', 'SOP — Vaccination and Feeding Programme'],
    ['12', 'Help — When You Get Stuck'],
    ['13', 'Quick Reference Card'],
  ]
  toc.forEach(([n, title]) => {
    guard(10)
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(n + '.', M, y)
    doc.text(title, M + 12, y)
    doc.setLineDashPattern([1, 2], 0)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    const x1 = M + 12 + doc.getTextWidth(title) + 4
    const x2 = W - M - 4
    if (x2 > x1) doc.line(x1, y - 1, x2, y - 1)
    doc.setLineDashPattern([], 0)
    y += 10
  })

  // ── CHAPTER 1: GETTING STARTED ────────────────────────────────────────────
  addPage()
  chapterHead('1. Getting Started — First Time Setup')
  body('Before you use the app every day, you need to set it up once. This takes about 10 minutes. Follow these four steps in order and you will be ready.')
  sp(3)

  subHead('Step A — Add Your Flock')
  body('Your "flock" is your group of chickens. The app needs to know about them before it can calculate anything.')
  sp(3)
  step(1, 'Tap "Registry" in the menu on the left side of the screen.')
  step(2, 'Tap the "Flocks" tab near the top of the page.')
  step(3, 'Fill in the form: a name for the flock (for example "Batch 1"), the date you received the chicks, how many chicks you received, and how old they were in weeks when you got them.')
  step(4, 'Tap the green "Add Flock" button. Your flock is now saved.')
  tip('If you got day-old chicks, type "0" or "1" for age in weeks. If you bought 6-week-old chicks from a farm, type "6". When in doubt, ask the supplier.')
  sp()

  subHead('Step B — Check Your Feed and Vaccine Prices')
  body('The app already has Chick Mash, Grower Mash, Layer Mash, and common vaccines loaded in. You just need to confirm the prices match what you actually pay.')
  sp(3)
  step(1, 'Tap "Registry" in the menu.')
  step(2, 'Tap the "Inputs and Prices" tab.')
  step(3, 'Look through the list. If a price is wrong, tap "Update price" next to that item and type the correct price from your latest receipt.')
  tip('Prices for feed are entered per 50 kg bag. So if you buy a 50 kg bag of Layer Mash for KES 3,900 — type 3900.')
  sp()

  subHead('Step C — Add Your Egg Buyers')
  body('The people you sell eggs to regularly are called "clients". Adding them now means recording sales later takes only a few seconds.')
  sp(3)
  step(1, 'Tap "Clients" in the menu.')
  step(2, 'Fill in the person\'s name, phone number, where they live, and how much you charge for delivery. If delivery is free, put 0.')
  step(3, 'Tap "Add Client". They will now appear in a dropdown when you record a sale.')
  sp()

  subHead('Step D — Generate Your Vaccination Schedule')
  body('The app can automatically calculate the exact dates for all 9 Kenchic vaccinations, based on the date your chicks arrived.')
  sp(3)
  step(1, 'Tap "SOP" in the menu.')
  step(2, 'Make sure the "Vaccination" tab is selected at the top.')
  step(3, 'Choose your flock from the dropdown box.')
  step(4, 'Tap the green "Generate Schedule" button.')
  step(5, 'All vaccination dates will appear. The app will remind you when each one is due.')
  tip('Once the schedule is generated, the Dashboard will show a red warning whenever a vaccination is overdue. You will never miss one.')
  sp(4)

  subHead('You Are Ready!')
  body('That is all the setup you need to do. From now on, the only routine is: open the app each morning and fill in the Daily Log. The rest of the app looks after itself.')

  // ── CHAPTER 2: DASHBOARD ─────────────────────────────────────────────────
  addPage()
  chapterHead('2. Dashboard — Your Farm at a Glance')
  body('The Dashboard is the front page of your app. Every time you open it, this is the first screen you see. It gives you the most important numbers from your farm without you having to look anywhere else.')
  sp()

  subHead('The Four Summary Cards')
  body('At the top of the Dashboard are four coloured boxes. Here is what each one means:')
  sp(4)

  // No emoji — plain text labels
  const dashCards = [
    ['Eggs Today',         'How many eggs were collected across all your flocks today.'],
    ['Feed Cost Today',    'How much you spent on feed today, in Kenyan Shillings (KES).'],
    ['Total Birds',        'The total number of live chickens in all your active flocks right now.'],
    ['Revenue This Month', 'How much money you have brought in from egg sales this calendar month.'],
  ]
  dashCards.forEach(([title, desc]) => {
    guard(16)
    doc.setFillColor(...LGREEN)
    doc.roundedRect(M, y, CW, 13, 2, 2, 'F')
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GREEN)
    doc.text(title + ':', M + 5, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(desc, M + 5 + doc.getTextWidth(title + ':') + 3, y + 9)
    y += 17
  })

  sp()
  subHead('Warning Banners')
  body('Below the cards you may sometimes see a coloured warning strip. These are important — do not ignore them.')
  sp(4)
  bullet('Yellow warning: A feed or vaccine price has not been reviewed in more than 30 days. Go to Registry, tap "Inputs and Prices", and tap "Update price" to confirm the current price.')
  sp(2)
  bullet('Red warning: A vaccination is overdue. Go to SOP, select your flock, and mark the vaccine as done.')
  sp(4)
  important('Outdated prices mean your profit calculations will be wrong. A missed vaccination can make your whole flock sick. Check these warnings the same day they appear.')
  sp()

  subHead('Quick Action Buttons')
  body('At the bottom of the Dashboard you will see two shortcut buttons:')
  sp(3)
  bullet('"Record Today\'s Eggs" — takes you straight to the Daily Log. Use this every morning.')
  sp(2)
  bullet('"Record a Sale" — takes you straight to the Sales page. Use this whenever you deliver eggs to a client.')

  // ── CHAPTER 3: DAILY LOG ─────────────────────────────────────────────────
  addPage()
  chapterHead('3. Daily Log — Recording Each Day')
  body('The Daily Log is where you do your most important daily work. Every morning, you should open this page and record: how many eggs you collected, how much feed you gave, how much water you gave, and any deaths. It only takes a few minutes.')
  sp(3)
  important('Before saving anything on this page, you must first select the correct Flock and Date at the very top. If either is missing, your information will not be saved.')
  sp()

  subHead('Recording Eggs')
  step(1, 'Tap "Daily Log" in the menu.')
  step(2, 'At the very top, check that the Date box shows today\'s date. If not, tap it and choose today.')
  step(3, 'Tap the Flock dropdown and select your flock. For example: "Batch 1 (198 birds)".')
  step(4, 'In the yellow "Eggs" box on the left, type the total number of eggs you collected. Just count every egg — broken ones too. For example: 152.')
  step(5, 'Below that, in "Broken eggs", type how many were cracked or too dirty to sell.')
  step(6, 'Tap the yellow "Save Eggs" button.')
  tip('The app automatically works out how many trays that is. 12 eggs = 1 tray. If you collected 152 eggs, it will show "12 trays + 8 loose". You do not need to count trays yourself.')
  sp()

  subHead('Recording Feed')
  step(1, 'In the green "Feed" card, check which feed type is selected. The app usually picks the right one based on your flock\'s age (Chick Mash for young birds, Layer Mash for older ones).')
  step(2, 'If the wrong feed is selected, tap the dropdown and choose the correct one.')
  step(3, 'In the "Quantity (kg)" box, type how many kilograms of feed you actually gave — not the recommended amount, the real amount.')
  step(4, 'The app shows the estimated cost below the box.')
  step(5, 'Tap "Save Feed".')
  tip('Notice the small green banner near the top of the page. It tells you what phase your flock is in (Starter, Grower, or Layer), how old they are in weeks, and how much feed they should be getting per day. The quantity box is pre-filled with the recommended amount — but you can change it.')
  sp()

  subHead('Recording Water')
  step(1, 'In the blue "Water" card, type the number of litres of water you put out for the flock.')
  step(2, 'Tap "Save Water".')
  tip('The app shows a suggested water amount based on the flock size and age. This is just a guide — what matters is recording what you actually gave.')
  sp()

  subHead('Correcting a Mistake')
  body('If you typed the wrong number, you can fix it any time. Your records for the selected date appear below the four cards after you save.')
  sp(3)
  step(1, 'At the top of Daily Log, select the flock and the date you want to fix.')
  step(2, 'Scroll down below the cards to see the saved records for that day.')
  step(3, 'Find the wrong record. Tap "Edit" to change the number, then tap "Save".')
  step(4, 'Or tap "Delete" if you want to remove that record completely. You will be asked to confirm.')

  // ── CHAPTER 4: MORTALITY ─────────────────────────────────────────────────
  addPage()
  chapterHead('4. Mortality — Recording Bird Deaths')
  body('Whenever a chicken dies, is culled, slaughtered, or removed from the flock, you must record it here. This keeps the bird count accurate, which affects your feed calculations and your reports.')
  sp()

  subHead('Recording a Death')
  step(1, 'Tap "Daily Log" in the menu.')
  step(2, 'Select the flock and the date at the top (as you always do).')
  step(3, 'Look at the four cards. The red one on the right says "Mortality". Fill in the form inside it.')
  step(4, 'From the "Type" dropdown, choose the reason:')
  sp(3)

  const mortalityTypes = [
    ['Sickness',      'The bird died from a disease or infection. This is the most common type.'],
    ['Culling',       'You deliberately removed a sick or very weak bird to protect the rest of the flock.'],
    ['Slaughter',     'Birds were intentionally killed — for example, sold as broilers or cooked for the family.'],
    ['Natural / Age', 'The bird died on its own without a clear cause — old age, or found dead in the morning.'],
  ]
  mortalityTypes.forEach(([type, desc]) => {
    guard(14)
    doc.setFillColor(252, 245, 245)
    doc.roundedRect(M + 5, y, CW - 5, 12, 2, 2, 'F')
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(160, 30, 30)
    doc.text(type + ':', M + 10, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(desc, M + 10 + doc.getTextWidth(type + ':') + 3, y + 8)
    y += 16
  })

  sp()
  step(5, 'In "Birds lost", type how many birds died or were removed.')
  step(6, 'In "Notes" (optional), write a short description — for example: "found near drinker" or "sold 4 birds for slaughter".')
  step(7, 'Tap the red "Log Mortality" button.')
  sp(3)
  tip('The flock\'s total bird count goes down automatically as soon as you save. For example, if you had 198 birds and log 2 deaths, it will show 196 from now on. This new count affects feed recommendations and reports.')
  sp()

  subHead('Viewing All Past Deaths — Mortality History Tab')
  body('To see a full list of all the deaths ever recorded for a flock:')
  sp(3)
  step(1, 'Tap "Daily Log" in the menu.')
  step(2, 'Select the flock at the top.')
  step(3, 'At the top of the page, tap the "Mortality History" button. It is next to "Daily Entry".')
  step(4, 'You will see four boxes showing the total birds lost by cause type. Below that, every mortality record is listed with date, type, count, and notes.')
  sp()

  subHead('Editing or Deleting a Mortality Record')
  step(1, 'In the Mortality History tab, find the record you want to change.')
  step(2, 'Tap "Edit" to change the count, type, or notes. Tap "Save" when you are done.')
  step(3, 'Tap "Delete" to remove the record. The bird count for the flock will go back up to what it was before that record was entered.')
  sp(3)
  important('Deleting a mortality record restores the bird count. Only delete if you entered it by mistake. If a bird genuinely died, keep the record even if the details are slightly wrong — you can always edit them instead.')

  // ── CHAPTER 5: CALENDAR ──────────────────────────────────────────────────
  addPage()
  chapterHead('5. Calendar — Looking Back at Past Days')
  body('The Calendar gives you a bird\'s eye view of any month. Days where you recorded data are highlighted, so you can quickly see which days have entries and which days were missed.')
  sp()

  subHead('How to Navigate the Calendar')
  step(1, 'Tap "Calendar" in the menu.')
  step(2, 'You will see the current month displayed as a grid of days.')
  step(3, 'Days that have data will show a small egg count and feed cost on them.')
  step(4, 'Tap any day to see the full details — eggs, feed, water, and sales for that day.')
  step(5, 'Tap the back arrow button on the left to go back one month, or the forward arrow button on the right to go forward one month.')
  step(6, 'Tap "Today" to return instantly to the current month.')
  sp(3)
  tip('The Calendar is very useful for finding missed days. If you see a blank day in the middle of the month when you know you collected eggs, go to Daily Log, change the date to that day, and fill it in. The calendar does not mind if you fill in past dates.')

  // ── CHAPTER 6: ANALYTICS ─────────────────────────────────────────────────
  addPage()
  chapterHead('6. Analytics — Charts and Trends')
  body('The Analytics page shows your farm\'s performance as graphs (pictures made of lines and bars). You do not need to do anything — the graphs update themselves. They help you spot whether things are going in the right direction.')
  sp()

  subHead('The Three Charts Explained')
  sp(3)
  body('CHART 1 — Egg Production (Line Chart)')
  body('This shows the number of eggs collected each day, as a line moving from left to right across the page. A line going UP means egg production is increasing. A line going DOWN means fewer eggs. A flat line means production is steady.', 4)
  sp(6)
  body('CHART 2 — Revenue vs Feed Cost (Bar Chart)')
  body('Each day has two bars side by side. The GREEN bar shows money that came in (sales revenue). The RED bar shows money that went out (feed costs). You want the green bar to be taller than the red bar — that means you are making a profit.', 4)
  sp(6)
  body('CHART 3 — Feed Cost vs Egg Output (Scatter Chart)')
  body('Each dot represents one day. The position of the dot shows how much you spent on feed that day and how many eggs you got. If the dots form a rising pattern from left to right, it means spending more on feed is producing more eggs — a healthy sign.', 4)
  sp()

  subHead('Changing the Time Period')
  body('At the top of the page you will see three buttons labelled "7d", "30d", and "90d". These control how far back the charts look.')
  sp(4)
  bullet('"7d" — Last 7 days. Good for seeing this week\'s performance.')
  sp(2)
  bullet('"30d" — Last 30 days. Good for a monthly overview.')
  sp(2)
  bullet('"90d" — Last 90 days. Good for spotting seasonal trends.')
  sp(4)
  tip('If you have just started using the app, the charts will look sparse until you have a few weeks of data. Keep recording daily and the picture will fill in.')

  // ── CHAPTER 7: CLIENTS ───────────────────────────────────────────────────
  addPage()
  chapterHead('7. Clients — Managing Your Egg Buyers')
  body('Clients are the people and businesses that regularly buy eggs from you. Registering them here means you never have to type their name, phone number, or delivery cost when recording a sale — you just pick from a list.')
  sp()

  subHead('Adding a New Client')
  step(1, 'Tap "Clients" in the menu.')
  step(2, 'Fill in the form on the left side of the page:')
  sp(3)
  bullet('Name: The person\'s or business\'s full name.', 8)
  bullet('Phone: Their mobile number. This is optional but useful to have.', 8)
  bullet('Location: Where they are — for example "Kisumu Town" or "Mama Odhiambo next door".', 8)
  bullet('Delivery cost (KES): How much you usually charge for delivering eggs. If you deliver for free, type 0.', 8)
  sp(3)
  step(3, 'Tap "Add Client". They will now appear in the client list and in the Sales dropdown.')
  sp()

  subHead('Deactivating a Client Who Has Stopped Buying')
  body('If a client stops buying from you, do NOT delete them. Instead, deactivate them.')
  sp(3)
  step(1, 'Find the client in the list on the right side of the page.')
  step(2, 'Tap "Deactivate". They will disappear from the Sales dropdown but their old records are kept safe.')
  sp(3)
  tip('If they start buying again later, you can reactivate them from the same list.')

  // ── CHAPTER 8: SALES ─────────────────────────────────────────────────────
  addPage()
  chapterHead('8. Sales — Recording Every Egg Sale')
  body('Every time you sell eggs, record it here. The Sales page has two types of sale:')
  sp(3)
  bullet('Client Sale: A regular sale to one of your registered clients — usually a full tray or more.')
  sp(2)
  bullet('Ad-hoc Sale: A small one-off sale to someone passing by — usually less than a full tray (fewer than 12 eggs). No client name needed.')
  sp()

  subHead('Recording a Client Sale')
  step(1, 'Tap "Sales" in the menu.')
  step(2, 'Make sure the "Client Sale" tab is selected at the top.')
  step(3, 'Select the client from the dropdown. If they are not listed, go to Clients first and add them.')
  step(4, 'Choose the date of the sale.')
  step(5, 'Type the number of eggs sold — for example, 360 (which is 30 trays).')
  step(6, 'Type the price you charged per egg — for example, KES 18.')
  step(7, 'The delivery cost will be filled in automatically from the client\'s profile. Change it here if this particular delivery was different.')
  step(8, 'Check the total amount shown at the bottom of the form. If it looks correct, tap "Save Sale".')
  sp(3)
  tip('The total is: (number of eggs x price per egg) + delivery cost. For example: 360 eggs x KES 18 = KES 6,480. Plus KES 200 delivery = KES 6,680 total.')
  sp()

  subHead('Recording an Ad-hoc Sale')
  step(1, 'Tap "Sales" in the menu.')
  step(2, 'Tap the "Ad-hoc Sale" tab.')
  step(3, 'Choose the date.')
  step(4, 'Type the number of eggs (1 to 11 eggs — for small walk-in purchases).')
  step(5, 'Type the price per egg.')
  step(6, 'Tap "Save Ad-hoc Sale".')
  sp()

  subHead('Viewing Past Sales — The History Tab')
  step(1, 'Tap "Sales" in the menu.')
  step(2, 'Tap the "History" tab near the top of the page.')
  step(3, 'You will see all past sales. Client sales and ad-hoc sales appear in separate lists.')
  step(4, 'When a client pays you, find their sale in the list and tap "Mark paid". This keeps your payment records accurate.')
  sp()

  subHead('Fixing a Wrong Sale')
  step(1, 'In the History tab, find the sale that was entered incorrectly.')
  step(2, 'Tap "Edit" to correct the number of eggs, price, or delivery cost. Tap "Save" when done.')
  step(3, 'Tap "Delete" to remove the sale completely.')
  sp(3)
  important('Be careful when deleting a sale that has already been marked as paid. The payment record will also be removed. Only delete if the sale was entered entirely by mistake.')

  // ── CHAPTER 9: REGISTRY ──────────────────────────────────────────────────
  addPage()
  chapterHead('9. Registry — Flocks and Input Prices')
  body('The Registry is where all the basic information lives. Your flocks are registered here, and all the prices for what you buy (feeds, vaccines) are stored here. Every other part of the app uses this information, so keeping it accurate is very important.')
  sp()

  subHead('The Flocks Tab')
  body('This tab shows all your registered flocks. Each flock card tells you:')
  sp(3)
  bullet('The flock name and current live bird count')
  bullet('The current phase (Starter, Grower, or Layer) and the flock\'s age in weeks — updated automatically every week')
  bullet('Which feed the flock should be on at this age')
  bullet('How many kilograms of feed you should be giving per day, based on the current bird count')
  sp()

  subHead('Adding a New Flock')
  step(1, 'Tap "Registry" in the menu and select the "Flocks" tab.')
  step(2, 'Fill in the form: flock name, date received, number of birds, age in weeks when received.')
  step(3, 'Add any notes if you wish (optional).')
  step(4, 'Tap "Add Flock".')
  sp(3)
  tip('The "age in weeks when received" field is important. If you got them at 1 day old, enter 0 or 1. If you bought 10-week-old growers, enter 10. The app uses this to calculate the current age and which phase they are in.')
  sp()

  subHead('Retiring a Flock vs Deleting a Flock')
  body('When a flock has finished its laying cycle, you have two options:')
  sp(3)
  bullet('"Deactivate" — the flock is retired. All its egg records, feed records, and sales history are kept. It disappears from the Daily Log dropdown so it does not clutter your daily work. Use this for flocks that have genuinely finished.')
  sp(3)
  bullet('"Delete" — the flock and ALL its data are permanently removed. Every egg, every feed record, every mortality log for that flock is gone forever. Only use this if you added a flock by mistake and it has no records.')
  sp(3)
  important('Never delete a flock just because it has finished laying. Always use "Deactivate" instead. Deleting a flock cannot be undone.')
  sp()

  subHead('The Inputs and Prices Tab')
  body('This tab shows everything you buy for the farm — feeds, vaccines, medicines. The app comes pre-loaded with the most common items. You just need to make sure the prices are up to date.')
  sp()

  subHead('Updating a Price')
  step(1, 'Tap "Registry" and select the "Inputs and Prices" tab.')
  step(2, 'Find the item whose price has changed — for example, "Layer Mash".')
  step(3, 'Tap "Update price".')
  step(4, 'Type the new price (per 50 kg bag for feeds) and tap OK.')
  sp(3)
  tip('The Dashboard shows a yellow warning if a price has not been updated in over 30 days. When you see this, go to Registry and update the prices from your most recent receipt.')
  sp()

  subHead('Adding a New Item')
  step(1, 'Fill in the form at the top of the Inputs and Prices tab: Name, Category (feed / vaccine / medicine / other), Unit, and Price.')
  step(2, 'Tap "Add Input".')

  // ── CHAPTER 10: REPORTS ──────────────────────────────────────────────────
  addPage()
  chapterHead('10. Reports — Summaries and PDF Export')
  body('The Reports page automatically produces a financial summary of your farm for six different time periods. You do not need to set anything up — just go to this page and everything is calculated for you.')
  sp()

  subHead('The Six Report Periods')
  const periods = [
    '1.   This Week — from Monday this week up to today.',
    '2.   Last Week — the complete week before this one (Monday to Sunday).',
    '3.   This Month — from the 1st of this month up to today.',
    '4.   Last Month — the complete previous calendar month.',
    '5.   This Year — from 1st January this year up to today.',
    '6.   Last Year — the complete previous calendar year.',
  ]
  periods.forEach(p => { body(p, 4); sp(1) })
  sp()

  subHead('What Each Report Shows')
  sp(3)
  autoTable(doc, {
    startY: y,
    head: [['What it shows', 'What it means']],
    body: [
      ['Live birds (current)',  'Total live chickens in all active flocks right now.'],
      ['Total eggs',            'All eggs collected in the period, plus the total tray count.'],
      ['Feed cost',             'Total KES spent on feed.'],
      ['Vaccine cost',          'Total KES spent on vaccinations that were marked as done.'],
      ['Client sales',          'Total KES earned from sales to registered clients.'],
      ['Ad-hoc sales',          'Total KES earned from small walk-in sales.'],
      ['Total revenue',         'Client sales plus ad-hoc sales combined.'],
      ['Net profit',            'Total revenue minus feed cost minus vaccine cost. Green = profit. Red = loss.'],
      ['Mortality (period)',    'Total birds lost in the period, split by Sickness / Culling / Slaughter / Age.'],
    ],
    headStyles: { fillColor: GREEN, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles:  { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [244, 250, 247] },
    columnStyles: { 0: { cellWidth: 48, fontStyle: 'bold' }, 1: { cellWidth: 118 } },
    margin: { left: M, right: M },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  sp()
  subHead('Exporting a Report as a PDF')
  body('You can save or print any report as a PDF file and share it by WhatsApp or email.')
  sp(3)
  step(1, 'Find the report you want — for example "This Month".')
  step(2, 'Tap the small green "Export PDF" button in the top right corner of that card.')
  step(3, 'A PDF will be downloaded to your device. The file will be named something like "Wandera-Farm-This-Month-2026-06-14.pdf".')
  step(4, 'Open your downloads folder on the tablet, find the file, and share it via WhatsApp, email, or print it.')
  sp(3)
  tip('The exported PDF is fully branded with the Wandera farm name. It includes all the figures in the report — including the mortality breakdown. It is suitable for sharing with family members or a farm adviser.')

  // ── CHAPTER 11: SOP ──────────────────────────────────────────────────────
  addPage()
  chapterHead('11. SOP — Vaccination and Feeding Programme')
  body('SOP stands for Standard Operating Procedures. This section of the app contains the official Kenchic layer programme — the vaccination schedule and feeding guide that should be followed for every layer flock. The app turns this into a live tracker for each flock.')
  sp()

  subHead('The Vaccination Tracker')
  body('After you generate a vaccination schedule for your flock (see Chapter 1), the SOP page becomes a live tracker. Vaccinations are sorted into three groups:')
  sp(4)
  bullet('OVERDUE (shown in red): These are past their due date and have not been recorded as done. Act on these today.')
  sp(2)
  bullet('UPCOMING (shown in blue): These are coming soon. Plan ahead — check you have the vaccine in stock.')
  sp(2)
  bullet('COMPLETED (shown in green): These are done. Kept as a permanent record.')
  sp()

  subHead('How to Mark a Vaccination as Done')
  step(1, 'Tap "SOP" in the menu.')
  step(2, 'Select the "Vaccination" tab.')
  step(3, 'Choose your flock from the dropdown.')
  step(4, 'Find the vaccination in the Overdue or Upcoming list.')
  step(5, 'Tap "Mark Done".')
  step(6, 'A small form appears. Fill in: the actual date you gave it (today\'s date is pre-filled), the cost in KES (check your receipt), and any notes — for example "no adverse reactions".')
  step(7, 'Tap "Confirm".')
  sp(3)
  tip('The cost you enter here is automatically counted in the Reports page under "Vaccine cost". Your profit calculations will be accurate without you doing anything extra.')
  sp()

  subHead('If You Marked a Vaccination by Mistake')
  step(1, 'Find the vaccine in the Completed section.')
  step(2, 'Tap "Undo". It will move back to Upcoming or Overdue.')
  sp()

  subHead('The Complete Kenchic Vaccination Schedule')
  body('Here are all 9 vaccinations in the standard Kenchic Layer programme. The app generates these dates automatically:')
  sp(3)
  autoTable(doc, {
    startY: y,
    head: [['Day', 'Vaccine Name', 'How to Give It', 'Key Note']],
    body: [
      ['Day 1',                    'Marek\'s Disease',   'Injection', 'Done at hatchery before chicks leave'],
      ['Day 7',                    'Newcastle + IB',     'Eye drop',  'One drop into each eye, hold bird still'],
      ['Day 14',                   'Gumboro (IBD)',      'Water',     'Withhold water for 2 hours beforehand'],
      ['Day 21',                   'Newcastle (ND)',     'Water',     'Clean the drinkers thoroughly first'],
      ['Day 28',                   'Gumboro booster',   'Water',     'Withhold water for 2 hours beforehand'],
      ['Day 42',                   'Fowl Typhoid',      'Injection', 'Into the wing web, sterile needle per bird'],
      ['Day 56',                   'Newcastle booster', 'Water',     '—'],
      ['Day 84',                   'Fowl Typhoid boost','Injection', 'Into the wing web'],
      ['Day 112',                  'Newcastle pre-lay', 'Water',     'Must be done before point of lay begins'],
      ['Every 3 months (Week 19+)','Newcastle ongoing', 'Water',     'Continue throughout the laying life'],
    ],
    headStyles: { fillColor: GREEN, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles:  { fontSize: 8.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [244, 250, 247] },
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 44 }, 2: { cellWidth: 26 }, 3: { cellWidth: 64 } },
    margin: { left: M, right: M },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  sp()
  subHead('The Feeding Guide')
  body('Which feed to use depends on the age of the flock. The Daily Log phase banner tells you which phase you are in at all times.')
  sp(3)
  autoTable(doc, {
    startY: y,
    head: [['Phase', 'Weeks', 'Feed Type', 'Daily Amount per Bird', 'Key Tips']],
    body: [
      ['Starter', '1-8',  'Chick Mash',  '10g rising to 40g by Week 8', 'Ad-lib feeding. Keep feeders near heat source. Check for pasty butt daily.'],
      ['Grower',  '9-18', 'Grower Mash', '70-90g per bird per day',      'Reduce heat gradually. Ensure good space. Deworm at weeks 10 and 16.'],
      ['Layer',   '19+',  'Layer Mash',  '110-120g per bird per day',    'Switch at first signs of lay (red comb, squatting). Consider oyster shell supplement.'],
    ],
    headStyles: { fillColor: GREEN, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles:  { fontSize: 8.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [244, 250, 247] },
    columnStyles: { 0: { cellWidth: 17 }, 1: { cellWidth: 13 }, 2: { cellWidth: 26 }, 3: { cellWidth: 38 }, 4: { cellWidth: 72 } },
    margin: { left: M, right: M },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // ── CHAPTER 12: HELP ─────────────────────────────────────────────────────
  addPage()
  chapterHead('12. Help — When You Get Stuck')
  body('The Help page is always in the menu and has answers to the most common questions. But here are the most useful ones in case you are reading this manual away from the tablet:')
  sp()

  // Plain text only — no special characters
  const problems: [string, string][] = [
    ['My data is not saving',
     'Make sure you have selected a Flock and a Date at the top of the Daily Log page. Both fields must be chosen before you can save anything.'],
    ['I entered the wrong number of eggs',
     'Go to Daily Log. Select the flock and the date of the mistake. Scroll down below the cards to see the saved records. Tap "Edit" next to the eggs record, correct the number, and tap "Save".'],
    ['The feed cost in Reports looks wrong',
     'Go to Registry, then tap "Inputs and Prices". Check that the feed prices match what you currently pay. Tap "Update price" to correct any that are out of date.'],
    ['The bird count looks too low',
     'Check the Mortality History tab in Daily Log (select the flock first). A mortality record may have been saved by mistake. Tap "Delete" to remove it — the count will go back up.'],
    ['A client is not appearing in Sales',
     'They may not have been added yet. Tap "Clients" in the menu, add them, then come back to Sales.'],
    ['A vaccination is showing as overdue',
     'Go to SOP, choose your flock, find the vaccine in the Overdue list, and tap "Mark Done" to record that it was given.'],
    ['I cannot find a past sale',
     'Tap "Sales" then the "History" tab. Client sales and ad-hoc sales are in separate lists — check both.'],
    ['The app is slow or not loading',
     'Check that the tablet has a working internet connection. The app needs internet to show and save data. Move closer to the Wi-Fi router if needed.'],
  ]

  problems.forEach(([prob, sol]) => {
    const probLines = doc.splitTextToSize('Problem: ' + prob, CW - 10)
    const solLines  = doc.splitTextToSize('Solution: ' + sol,  CW - 10)
    const bh = probLines.length * 5 + solLines.length * 5 + 14
    guard(bh + 4)
    doc.setFillColor(252, 252, 252)
    doc.roundedRect(M, y, CW, bh, 3, 3, 'F')
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, bh, 3, 3, 'S')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(160, 50, 0)
    doc.text(probLines, M + 5, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(solLines, M + 5, y + 7 + probLines.length * 5 + 3)
    y += bh + 5
    doc.setLineWidth(0.2)
  })

  // ── CHAPTER 13: QUICK REFERENCE ──────────────────────────────────────────
  addPage()
  chapterHead('13. Quick Reference Card')
  body('Photograph this page and keep it near your tablet. It gives you everything you need for your daily routine at a glance.')
  sp()

  subHead('Your Morning Routine — Do This Every Day')
  sp(3)
  const routine = [
    'Open the app on your tablet.',
    'Tap "Daily Log".',
    'At the top: select your flock and confirm the date is today.',
    'Record your eggs — type the total number collected.',
    'Record your feed — confirm the amount in kg.',
    'Record your water — type the litres given.',
    'If any bird died — tap the Mortality card, choose the type, and enter the count.',
    'Tap "Dashboard" to see today\'s summary.',
    'If you sold eggs today — tap "Sales" and record the sale.',
  ]
  routine.forEach((item, i) => {
    guard(11)
    const bg: [number,number,number] = i % 2 === 0 ? [244,250,247] : [252,252,252]
    doc.setFillColor(...bg)
    doc.roundedRect(M, y, CW, 10, 1, 1, 'F')
    doc.setFontSize(9.5)
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
    doc.setTextColor(...DARK)
    doc.text(`${i + 1}.   ${item}`, M + 4, y + 7)
    y += 12
  })

  sp()
  subHead('Menu Quick Guide')
  sp(3)
  autoTable(doc, {
    startY: y,
    head: [['Menu Item', 'Use it for...']],
    body: [
      ['Welcome',   'A one-page reminder of what every part of the app does.'],
      ['Dashboard', 'Today\'s egg count, feed cost, bird total, revenue, and any warnings.'],
      ['Daily Log', 'Recording eggs, feed, water, and bird deaths every morning.'],
      ['Calendar',  'Looking at any past day to see what was recorded.'],
      ['Analytics', 'Line and bar charts showing trends over 7, 30, or 90 days.'],
      ['Clients',   'Adding and managing the people you sell eggs to.'],
      ['Sales',     'Recording every egg sale — client deliveries and small walk-in sales.'],
      ['Registry',  'Managing flock records and keeping feed/vaccine prices up to date.'],
      ['Reports',   'Automatic profit and loss summaries for this week, month, and year. Export to PDF.'],
      ['SOP',       'Vaccination tracker and Kenchic feeding guide. Mark vaccines as done here.'],
      ['Help',      'Type any question and get an answer, or browse by topic.'],
    ],
    headStyles: { fillColor: GREEN, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles:  { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [244, 250, 247] },
    columnStyles: { 0: { cellWidth: 27, fontStyle: 'bold' }, 1: { cellWidth: 139 } },
    margin: { left: M, right: M },
  })
  y = (doc as any).lastAutoTable.finalY + 14

  // Closing band
  guard(32)
  doc.setFillColor(...GREEN)
  doc.roundedRect(M, y, CW, 32, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('times', 'bold')
  doc.text('WANDERA', W / 2, y + 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Retirement Chicken Business', W / 2, y + 20, { align: 'center' })
  doc.text('Built with love for the family   |   ' + format(new Date(), 'd MMMM yyyy'), W / 2, y + 27, { align: 'center' })

  doc.save(`Wandera-Farm-User-Manual-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export default function ManualPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  async function handle() {
    setLoading(true)
    setDone(false)
    try { await generateManual(); setDone(true) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">User Manual</h1>
      <p className="text-gray-500 text-sm mb-8">
        A complete, print-ready PDF guide to every feature in the app — written in plain language for everyday use.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4 text-lg">What is included</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            'Cover page with Wandera branding and chicken illustration',
            'Table of Contents',
            'Ch 1 — Getting Started: first-time setup in 4 steps',
            'Ch 2 — Dashboard: reading the daily summary cards',
            'Ch 3 — Daily Log: recording eggs, feed, and water',
            'Ch 4 — Mortality: logging deaths and viewing history',
            'Ch 5 — Calendar: finding and checking past days',
            'Ch 6 — Analytics: understanding the charts',
            'Ch 7 — Clients: adding and managing egg buyers',
            'Ch 8 — Sales: recording every sale',
            'Ch 9 — Registry: flocks and input prices',
            'Ch 10 — Reports: summaries and PDF export',
            'Ch 11 — SOP: vaccination tracker and feeding guide',
            'Ch 12 — Help: common problems and solutions',
            'Ch 13 — Quick Reference Card: the daily routine at a glance',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">v</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handle} disabled={loading}
        className="w-full bg-green-700 text-white rounded-2xl py-4 text-lg font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-3">
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Building PDF — please wait...
          </>
        ) : 'Download User Manual PDF'}
      </button>

      {done && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-4 text-sm font-medium text-center">
          Manual downloaded. Check your downloads folder. You can share it via WhatsApp or print it.
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-5">
        The PDF is generated directly on this device — no internet needed once the page has loaded.
      </p>
    </div>
  )
}
