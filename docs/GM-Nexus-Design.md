# GM Nexus

## Master Application Design & Development Specification

**Version:** 2.0
**Purpose:** Master product and technical specification for development by an AI coding agent
**Application type:** Desktop application
**Primary users:** Game Masters running tabletop RPG campaigns

---

# 1. Product Vision

**GM Nexus is a structured campaign database and live control center for tabletop RPG Game Masters.**

It combines three traditionally separate GM tools into one application:

1. **Campaign management and world knowledge**
2. **Live game/session management**
3. **OBS streaming/recording overlay**

The application should help the GM before, during, and after a session.

The core philosophy is:

> **GM Nexus is not a virtual tabletop. It is the GM's command center.**

It should not attempt to replace applications such as Foundry, Roll20, or dedicated virtual tabletops.

Instead, GM Nexus should manage the information and state surrounding the game:

```text id="5z4b5d"
CAMPAIGN
   │
   ├── World Knowledge
   │   ├── NPCs
   │   ├── Locations
   │   ├── Quests
   │   ├── Factions
   │   ├── Notes
   │   └── Relationships
   │
   ├── PLAY
   │   ├── Players
   │   ├── Health
   │   ├── Status Effects
   │   └── Session State
   │
   └── STREAM
       └── OBS Overlay
```

The application must work offline and store campaign data locally.

---

# 2. Supported Game Systems

Initial game systems:

* D&D
* URealms
* Star Trek Adventures (STA)

The application must remain system-agnostic.

Do not build the core application around D&D-specific assumptions.

Instead, game systems should eventually be able to define their own:

* Player resources
* Status effects
* Character fields
* Rules-specific information

---

# 3. Core Application Areas

GM Nexus consists of three primary areas.

```text id="3b5h89"
┌──────────────────────────────────────┐
│              GM NEXUS                │
├──────────────────────────────────────┤
│                                      │
│ 📖 CAMPAIGN BOOK                     │
│    Campaign knowledge & preparation   │
│                                      │
│ ⚔ PLAY                               │
│    Live session management            │
│                                      │
│ 📺 OBS                               │
│    Streaming/recording overlay        │
│                                      │
└──────────────────────────────────────┘
```

These areas must be tightly integrated.

The GM must be able to access the Campaign Book directly from the Playing screen.

The GM must not need multiple application windows.

---

# 4. Technology Stack

Recommended stack:

## Desktop

* Tauri 2
* Rust

## Frontend

* React
* TypeScript
* Vite

## Styling

* Tailwind CSS

## Database

* SQLite

## Real-time communication

* Local WebSocket server

## Development environment

* JetBrains WebStorm
* Junie

The architecture should keep the React frontend and Rust/Tauri backend cleanly separated.

---

# 5. High-Level Architecture

```text id="0j5tdv"
                    GM Nexus
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    Campaign Book    Play       OBS Overlay
          │            │            │
          └────────────┼────────────┘
                       │
                  Game State
                       │
              ┌────────▼────────┐
              │ Application      │
              │ State Layer      │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ SQLite Database  │
              └─────────────────┘

OBS Overlay
     │
     │ WebSocket
     ▼
Local Tauri/Web Server
```

The Campaign Book, Playing screen, and OBS overlay all use the same underlying campaign state.

---

# 6. Campaign

A campaign is the root entity of GM Nexus.

A campaign contains:

```text id="1y1xcp"
Campaign
├── Metadata
├── Players
├── NPCs
├── Locations
├── Quests
├── Factions
├── Notes
├── Sessions
├── Relationships
└── Overlay Configuration
```

Campaign fields:

```text id="a0nq7f"
id
name
gameSystem
createdAt
updatedAt
```

---

# 7. Campaign Selection

The application launches into a campaign selection screen.

Display:

* Campaign name
* Game system
* Number of players
* Last modified
* Open
* Edit
* Delete

Example:

```text id="u0s7ad"
┌──────────────────────────────────────────────────────────┐
│                       GM NEXUS                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Campaigns                                                │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ The Lost Kingdom                                     │ │
│ │ D&D                                                  │ │
│ │ 4 Players                                            │ │
│ │                                                      │ │
│ │                   [Open] [Edit] [Delete]            │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Starship Horizon                                     │ │
│ │ STA                                                  │ │
│ │ 5 Players                                            │ │
│ │                                                      │ │
│ │                   [Open] [Edit] [Delete]            │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│                   [+ New Campaign]                       │
└──────────────────────────────────────────────────────────┘
```

Deleting requires confirmation.

---

# 8. Campaign Book

The Campaign Book is the campaign's knowledge base.

It should contain:

```text id="j5x8fa"
📖 Campaign Book

├── Overview
├── Story
├── NPCs
├── Locations
├── Quests
├── Factions
├── Notes
├── Sessions
├── Relationships
└── Campaign Inbox
```

The Campaign Book should be available:

1. As a primary navigation area.
2. As an integrated slide-over panel from the Playing screen.

---

# 9. Campaign Book From Playing Screen

The GM must not need another window to access campaign information.

The Playing screen should contain a persistent:

**📖 Campaign Book**

button.

Clicking it opens a slide-over panel.

Example:

```text id="2r3k1b"
┌──────────────────────────────────────────────────────────────┐
│ PLAYING SCREEN                               📖 CAMPAIGN BOOK│
├──────────────────────────────────────────────┬───────────────┤
│                                              │               │
│                                              │ 📖 Overview   │
│              PLAYER CARDS                    │ 👤 NPCs       │
│                                              │ 🗺 Locations  │
│                                              │ ⚔ Quests      │
│                                              │ 🏳 Factions   │
│                                              │ 📝 Notes      │
│                                              │ 📅 Sessions   │
│                                              │ 🧠 Inbox      │
│                                              │               │
└──────────────────────────────────────────────┴───────────────┘
```

Closing the book returns the GM to the exact same Playing state.

---

# 10. Quick Add

Because GM Nexus must support improvisational campaigns, it must be possible to create campaign information very quickly.

Provide a global:

**+ Quick Add**

button.

Options:

```text id="f6g8z0"
+ NPC
+ Location
+ Quest
+ Faction
+ Note
+ Session Event
```

Quick creation should require as little information as possible.

The GM must be able to create an NPC in seconds.

Example:

```text id="yr2d67"
New NPC

Name:
[Martha]

Description:
[The friendly bartender.]

Location:
[The Rusty Dragon ▼]

             [Create NPC]
```

All additional information can be added later.

---

# 11. Campaign Inbox

The Campaign Inbox is for unfinished or temporary ideas.

Example:

```text id="k2b8u4"
🧠 CAMPAIGN INBOX

• Figure out why Martha knows Brom
• Add a rival adventuring party
• Decide what is inside the merchant's chest
• Create the Black Hand headquarters
```

Inbox items can later be converted into:

* NPC
* Location
* Quest
* Faction
* Note

This is specifically designed for improvisational play.

---

# 12. NPCs

NPCs are first-class campaign entities.

NPC fields:

```text id="l6w4u8"
NPC
├── id
├── campaignId
├── name
├── image
├── description
├── notes
├── factionId
├── locationId
├── createdAt
└── updatedAt
```

NPCs can have relationships with:

* Other NPCs
* Locations
* Quests
* Factions

Example:

```text id="t9x4j0"
Captain Brom

Description
Captain of the Greyhaven guard.

Location
Greyhaven

Related Quests
• The Missing Merchant

Related NPCs
• Lord Aldric
• Martha

Faction
Greyhaven Guard

GM Notes
Secretly works for the Black Hand.
```

---

# 13. Locations

Locations represent places within the campaign.

Location fields:

```text id="2v6p1r"
Location
├── id
├── campaignId
├── name
├── image
├── description
├── notes
├── parentLocationId
├── createdAt
└── updatedAt
```

Locations can contain:

* NPCs
* Quests
* Other locations
* Factions

Example:

```text id="q9a2j4"
Greyhaven

Description
A coastal city surrounded by ancient walls.

NPCs
• Captain Brom
• Martha
• Aria

Quests
• The Missing Merchant
• Bandits of Greyhaven

Locations
• The Rusty Dragon
• Guard Headquarters
• Blacksmith
```

---

# 14. Quests

Quest fields:

```text id="w4c1x8"
Quest
├── id
├── campaignId
├── name
├── description
├── status
├── notes
├── createdAt
└── updatedAt
```

Quest statuses:

```text id="z8p4g2"
Planned
Active
Completed
Failed
Abandoned
```

Quests may relate to:

* NPCs
* Locations
* Factions
* Other quests

Quests can have objectives.

Example:

```text id="b2h7d6"
THE MISSING MERCHANT

Status: Active

Description
A merchant disappeared while travelling
through the Darkwood.

Objectives

☐ Find the merchant
☐ Discover who kidnapped him
☐ Return him to Greyhaven

NPCs
• Captain Brom
• The Merchant
• The Black Hand

Locations
• Greyhaven
• Darkwood
• Bandit Camp

GM Notes
The merchant discovered a Black Hand
smuggling operation.
```

---

# 15. Factions

Factions represent organizations, groups, governments, guilds, enemies, etc.

Examples:

* The Black Hand
* Greyhaven Guard
* Adventurers Guild
* Starfleet
* Merchant Guild

Faction fields:

```text id="m8j5q0"
Faction
├── id
├── campaignId
├── name
├── description
├── image
├── notes
└── createdAt
```

Factions can relate to:

* NPCs
* Locations
* Quests
* Other factions

---

# 16. Notes

Notes should be flexible.

Campaign notes should support:

* Title
* Body
* Tags
* Related entities
* Created date
* Updated date

Notes may be attached to:

* Campaign
* NPC
* Location
* Quest
* Faction
* Session

The notes system should not force a rigid structure.

---

# 17. Relationships

Relationships are a core part of the campaign knowledge system.

The architecture should support relationships such as:

```text id="n6q0q2"
NPC ↔ NPC
NPC ↔ Quest
NPC ↔ Location
NPC ↔ Faction

Quest ↔ Location
Quest ↔ Faction
Quest ↔ Quest

Location ↔ Location

Faction ↔ Faction
Faction ↔ Location
```

Relationships should contain:

```text id="y8w2f5"
id
campaignId
sourceEntityId
sourceEntityType
targetEntityId
targetEntityType
relationshipType
notes
createdAt
```

Example:

```text id="x3j9s7"
Captain Brom
    │
    ├── works for → Black Hand
    ├── located at → Greyhaven
    ├── involved in → Missing Merchant
    └── knows → Martha
```

---

# 18. Relationship Graph

A visual relationship graph is a future feature.

Do not make it mandatory for MVP.

The underlying relationship model must support a future graph such as:

```text id="e7q2v9"
                 LORD ALDRIC
                     │
                  employs
                     ▼
                CAPTAIN BROM
                 /         \
              knows       serves
               /             \
              ▼               ▼
           MARTHA        BLACK HAND
              │
           works at
              ▼
          GREYHAVEN
```

Clicking a graph node should eventually open that entity's page.

---

# 19. Global Search

GM Nexus must provide campaign-wide search.

Search should cover:

* NPCs
* Locations
* Quests
* Factions
* Notes
* Sessions
* Players

Example:

```text id="7j1c8a"
🔎 Search campaign...

black hand

NPC
• Captain Brom

Quest
• The Missing Merchant

Faction
• The Black Hand

Location
• Greyhaven
```

Search should be fast and usable during live gameplay.

---

# 20. Backlinks

Where appropriate, entities should expose related entities.

For example:

Opening an NPC should show:

```text id="w0m3s6"
CAPTAIN BROM

Related NPCs
• Lord Aldric
• Martha

Related Quests
• The Missing Merchant

Related Locations
• Greyhaven

Related Factions
• Greyhaven Guard
• Black Hand
```

This provides a wiki-like navigation experience.

---

# 21. Session System

Sessions are first-class entities.

A session contains:

```text id="s4n2k7"
Session
├── id
├── campaignId
├── sessionNumber
├── title
├── date
├── summary
├── notes
├── events
├── createdAt
└── updatedAt
```

Example:

```text id="5k0d1r"
Session 12
The Missing Merchant

Date:
2026-08-16

Summary:
The party arrived in Greyhaven and
investigated the missing merchant.

Events:
• Met Martha
• Spoke with Captain Brom
• Discovered the Black Hand connection
• Found the merchant
```

---

# 22. Session Mode

Before starting a game, the GM can select:

**▶ Start Session**

This creates or opens the current session.

The Playing screen should know which session is active.

During play, the GM can add:

**+ Session Event**

Example:

```text id="g6f1q8"
Session Event

The players discovered that Martha
is secretly working for the guild.

[Add Event]
```

---

# 23. Session History

The Campaign Book should contain previous sessions.

```text id="a7s4c9"
Sessions

Session 01 — Arrival in Greyhaven
Session 02 — The Missing Merchant
Session 03 — Into the Darkwood
Session 04 — The Bandit Camp
Session 05 — The Black Hand
```

Opening a session shows its notes and events.

---

# 24. Campaign Timeline

Eventually, sessions and events should be viewable as a campaign timeline.

```text id="u4m7r2"
SESSION 01
│
├── Arrived in Greyhaven
└── Met Captain Brom

SESSION 02
│
├── Found the missing merchant
└── Discovered the Black Hand

SESSION 03
│
├── Entered Darkwood
└── Met the Witch
```

This is a future feature but the session architecture should support it.

---

# 25. GM Playing Screen

The Playing screen is optimized for live gameplay.

It must display player cards.

Each card MUST contain:

* Character image
* Character name
* Current health
* Maximum health
* Health bar
* Quick health buttons
* Status effects
* Add status effect button

Example:

```text id="p8h3c5"
┌─────────────────────────────────────┐
│                                     │
│          ┌──────────────┐           │
│          │              │           │
│          │   PLAYER     │           │
│          │    IMAGE     │           │
│          │              │           │
│          └──────────────┘           │
│                                     │
│                 ARIA                │
│                                     │
│               24 / 35               │
│        ███████████████░░░            │
│                                     │
│ [-10] [-3] [-1] [+1] [+3] [+10]    │
│                                     │
│ [ Blessed ] [ Inspired ]            │
│                                     │
│              [+ Status]             │
└─────────────────────────────────────┘
```

Player images must be visually prominent.

---

# 26. Health

Players have:

```text id="x1h7k2"
currentHealth
maximumHealth
```

Quick controls:

```text id="q9k4s1"
-10
-3
-1

+1
+3
+10
```

Health cannot go below zero in MVP.

Direct health editing must also be supported.

---

# 27. Status Effects

Status effects contain:

```text id="d4v8j2"
id
playerId
name
description
duration
icon
createdAt
updatedAt
```

The GM can:

* Add
* Remove
* Edit
* View active effects

Status effects must be system-agnostic.

---

# 28. Custom Player Resources

The architecture must support resources beyond health.

Examples:

```text id="v2j7s5"
Health       24 / 35
Stress        2 / 10
Mana          7 / 20
Determination 3
```

A resource should eventually support:

```text id="c8p5a0"
name
currentValue
maximumValue
icon
displayStyle
```

This allows D&D, URealms, STA and future systems to use different resources.

This does not need to be fully exposed in MVP.

---

# 29. Undo / Redo

Because the application is used during live gameplay, accidental clicks are likely.

The architecture should support an action history.

Example:

```text id="m4n8s3"
12:43 Aria -10 HP
12:44 Brom +3 HP
12:45 Aria gained Poisoned
12:47 Aria -3 HP
```

Eventually provide:

```text id="s7f2c1"
↶ Undo    ↷ Redo
```

Do not necessarily implement the complete feature in MVP, but structure state changes so it can be added.

---

# 30. GM Pins

The GM should be able to pin important campaign information.

Example:

```text id="f8s3j6"
📌 CURRENT QUEST
The Missing Merchant

📌 CURRENT LOCATION
Greyhaven

📌 IMPORTANT NPC
Captain Brom

📌 SECRET
Brom works for the Black Hand
```

Pinned information should be optionally visible from the Playing screen.

---

# 31. GM Dashboard

The Campaign Book Overview should provide a dashboard.

Example:

```text id="r2k6n9"
THE LOST KINGDOM

Current Location
Greyhaven

Current Quest
The Missing Merchant

Active Quests
• The Missing Merchant
• The Black Hand

Important NPCs
• Captain Brom
• Martha
• Lord Aldric

Recent Activity
• Created Martha
• Added Black Hand faction
• Started Session 12

Pinned
📌 Merchant knows the smuggling route
📌 Brom cannot be trusted
```

---

# 32. OBS Overlay

The application must provide an OBS Browser Source.

Example URL:

```text id="z5v1q8"
http://localhost:8421/overlay/{campaignId}
```

The exact port may be changed by implementation.

The overlay must have a transparent background.

It must display:

* Player image
* Player name
* Current/max health
* Health bar
* Status effects

---

# 33. OBS Real-Time Communication

Use WebSockets.

Events should include:

```text id="h7m4x1"
INITIAL_STATE

PLAYER_HEALTH_CHANGED

PLAYER_STATUS_ADDED

PLAYER_STATUS_REMOVED

PLAYER_UPDATED
```

Example:

```text id="v5k2p7"
{
  type: "PLAYER_HEALTH_CHANGED",
  playerId: "aria",
  oldHealth: 24,
  newHealth: 14,
  change: -10
}
```

The overlay must receive the current full state when connecting.

This ensures OBS works correctly even if it connects halfway through a session.

---

# 34. OBS Animations

Damage:

* Smooth health-bar decrease
* HP number animation
* Temporary negative number
* Subtle character/card reaction

Healing:

* Smooth health-bar increase
* HP number animation
* Temporary positive number
* Subtle healing reaction

Status added:

* Animate into list
* Brief highlight/pulse

Status removed:

* Fade out

Animations should be polished but restrained.

---

# 35. OBS Configuration

The application should have an Overlay section.

```text id="a4q8k2"
OBS OVERLAY

Browser Source URL

http://localhost:8421/overlay/abc123

[Copy URL]

[Open Preview]

Layout
[ Full Party ▼ ]

Players
☑ Aria
☑ Brom
☑ Cedric
☑ Dana
```

The GM should be able to copy the URL with one click.

---

# 36. OBS Layouts

MVP should contain one polished default layout.

Architecture should support future layouts:

```text id="g8v3n5"
Full Party
Minimal
Portraits
Combat
Story
```

Future customization:

* Player arrangement
* Size
* Position
* Fonts
* Health bar design
* Status effect display
* Animations
* Themes

---

# 37. Themes

Eventually support campaign/game-specific themes.

Potential themes:

```text id="x9c4s7"
Fantasy
Sci-Fi
Modern
Minimal
Custom
```

This is particularly useful for D&D, URealms and STA.

Do not make theme customization a blocker for MVP.

---

# 38. Character Images

Players and NPCs should support local images.

Supported:

* PNG
* JPG/JPEG
* WebP

Store images in an application-managed local asset directory.

SQLite should store references/paths rather than large image binaries.

Images should be resized appropriately when necessary.

---

# 39. Search and Navigation Philosophy

GM Nexus should optimize for:

> **"I remember something exists, but I don't remember where I put it."**

The GM should be able to find information quickly.

Navigation tools:

* Global search
* Campaign Book sidebar
* Backlinks
* Related entities
* Recent items
* Pinned items
* Command palette
* Campaign Inbox

---

# 40. Command Palette

Future feature.

Shortcut:

```text id="u1c5k8"
Ctrl + K
```

Example:

```text id="q7s3m2"
┌────────────────────────────────────────────┐
│ 🔎 Search or create...                    │
├────────────────────────────────────────────┤
│ Search campaign...                         │
│                                            │
│ + Create NPC                               │
│ + Create Location                          │
│ + Create Quest                             │
│ + Create Note                              │
│ + Create Session Event                     │
└────────────────────────────────────────────┘
```

Typing an entity name should navigate directly to it.

---

# 41. Quick Add Philosophy

The application must not force the GM to complete complicated forms during gameplay.

A GM should be able to create:

```text id="w6j9r3"
NPC:
Martha
```

and continue playing.

Detailed information can be added later.

The system should support progressively enriching entities.

---

# 42. Automatic Backups

Campaign data is extremely valuable.

Implement automatic local backups.

Potential triggers:

* Application startup
* Campaign load
* Campaign close
* Session end
* Daily backup

Provide:

```text id="s5h8k1"
Campaign
→ Export Campaign
→ Import Campaign
```

The exported campaign should contain:

* Campaign database
* Images
* Notes
* NPCs
* Locations
* Quests
* Factions
* Sessions
* Relationships
* Player data
* Overlay configuration

A campaign should be portable between installations.

---

# 43. Campaign Import/Export

Use a dedicated portable campaign format.

Conceptually:

```text id="f7n2v4"
The-Lost-Kingdom.gmnexus
```

The exact implementation format can be decided during development.

Import should validate the data before modifying the existing database.

---

# 44. GM-Only Information

Campaign entities should support private GM information.

Example:

```text id="e8c3s1"
Captain Brom

Public Information:
Captain of the Greyhaven guard.

GM Information:
Secretly works for the Black Hand.
```

This information must never automatically appear in the OBS overlay.

Future versions may support player-facing campaign views.

---

# 45. Session Recaps

Future feature.

At the end of a session, GM Nexus could generate a recap from:

* Session events
* Session notes
* Completed quests
* Important discoveries

Example:

```text id="k5r8w2"
SESSION 12 RECAP

The party arrived in Greyhaven and began
investigating the missing merchant.

They met Martha at the Rusty Dragon and
spoke with Captain Brom.

The party discovered evidence connecting
the disappearance to the Black Hand.

The merchant was eventually found in the
Darkwood.
```

The exact AI implementation can be added later.

---

# 46. Player Card Customization

Eventually allow the GM to decide what appears on player cards.

Possible fields:

```text id="z4j7c8"
☑ Portrait
☑ Name
☑ Health
☑ Health bar
☑ Status Effects
☐ Armor
☐ Level
☐ Class
☐ Custom Resources
```

This allows the same application to support different systems.

---

# 47. Security and Privacy

The application should be local-first.

Requirements:

* No cloud account required
* No campaign data sent externally
* Local SQLite database
* Local image storage
* OBS server bound to localhost where possible
* Do not expose the overlay server publicly by default

If AI features are introduced later, clearly indicate when campaign data leaves the local application.

---

# 48. Offline Requirements

All core features must work without internet access.

Offline functionality includes:

* Campaign management
* Campaign Book
* NPCs
* Locations
* Quests
* Factions
* Notes
* Sessions
* Players
* Health
* Status effects
* Images
* OBS overlay

---

# 49. Performance

The application should remain responsive with at least:

* 20 players
* 500 NPCs
* 500 locations
* 500 quests
* 1,000 notes
* 1,000 relationships
* 100 sessions

The normal expected campaign size will be significantly smaller.

Search should remain fast at these scales.

---

# 50. MVP Definition

The MVP should NOT attempt to implement every feature in this document.

The MVP should include:

## Campaign

* [ ] Create campaign
* [ ] Edit campaign
* [ ] Delete campaign
* [ ] Select game system
* [ ] Save locally

## Players

* [ ] Add/edit/remove players
* [ ] Player images
* [ ] Current/max health
* [ ] Health bar
* [ ] Quick health controls
* [ ] Status effects

## Campaign Book

* [ ] Overview
* [ ] NPCs
* [ ] Locations
* [ ] Quests
* [ ] Factions
* [ ] Notes
* [ ] Relationships
* [ ] Search
* [ ] Quick Add

## Playing

* [ ] Player cards
* [ ] Campaign Book slide-over
* [ ] Quick Add access
* [ ] Player state management

## Sessions

* [ ] Start session
* [ ] Session notes
* [ ] Session events
* [ ] Session history

## OBS

* [ ] Local overlay server
* [ ] Transparent overlay
* [ ] Player images
* [ ] Health bars
* [ ] Status effects
* [ ] WebSocket synchronization
* [ ] Damage animation
* [ ] Healing animation
* [ ] Status animations
* [ ] Copy overlay URL

## Reliability

* [ ] SQLite persistence
* [ ] Error handling
* [ ] Automatic WebSocket reconnect
* [ ] Initial state synchronization
* [ ] Basic backup/export

---

# 51. Future Features

The following should be architecturally possible but are not MVP requirements:

* Relationship graph
* Advanced command palette
* Campaign timeline
* Session recap generation
* AI-assisted campaign management
* Custom player resources
* Custom player cards
* Advanced OBS layouts
* OBS themes
* Custom animations
* Player-facing campaign portal
* Multiplayer GM collaboration
* Cloud synchronization
* Character sheets
* Initiative
* NPC combat tracking
* Inventory
* Maps
* Dice rolling
* Battle maps
* Voice/video
* Full VTT functionality

---

# 52. Suggested Database Structure

A future-compatible database should contain at least:

```text id="r7v3m1"
campaigns
players
status_effects

npcs
locations
quests
factions
notes
sessions
session_events
relationships

resources
campaign_settings
overlay_settings
```

Relationships should use a flexible entity-reference architecture where appropriate.

Do not create separate hardcoded relationship tables for every possible entity pair if a generalized relationship model can be implemented cleanly.

---

# 53. Suggested Frontend Structure

```text id="f8m2k5"
src/
├── app/
│   ├── App.tsx
│   ├── routes/
│   └── state/
│
├── components/
│   ├── campaign/
│   ├── player/
│   ├── npc/
│   ├── location/
│   ├── quest/
│   ├── faction/
│   ├── notes/
│   ├── sessions/
│   ├── relationships/
│   ├── health/
│   ├── status-effects/
│   ├── dialogs/
│   └── common/
│
├── pages/
│   ├── CampaignSelection/
│   ├── CampaignOverview/
│   ├── CampaignBook/
│   ├── PlayingScreen/
│   └── OverlaySettings/
│
├── overlay/
│   ├── OverlayApp.tsx
│   ├── components/
│   ├── animations/
│   └── websocket/
│
├── services/
│   ├── campaigns/
│   ├── players/
│   ├── npcs/
│   ├── locations/
│   ├── quests/
│   ├── factions/
│   ├── sessions/
│   ├── notes/
│   ├── relationships/
│   └── overlay/
│
├── types/
└── utils/
```

The exact structure may be modified by the developer if a cleaner architecture is identified.

---

# 54. Development Philosophy

The application must be built as a maintainable product.

Avoid:

* One enormous React component
* Hardcoded campaign data
* D&D-specific assumptions in core models
* Tight coupling between SQLite and UI
* Separate implementations of the same entity in different views
* Hardcoded OBS layouts
* Business logic embedded directly inside UI components

Prefer:

* Reusable components
* Typed domain models
* Service/repository layers
* Centralized state management
* Event-driven state changes
* Reusable entity detail components
* Shared campaign state
* Clear separation between domain logic and presentation

---

# 55. Development Phases

## Phase 1 — Foundation

* [ ] Tauri project
* [ ] React + TypeScript + Vite
* [ ] Tailwind
* [ ] SQLite
* [ ] Application state architecture
* [ ] Routing/navigation
* [ ] Core data models

## Phase 2 — Campaign

* [ ] Campaign selection
* [ ] Campaign creation
* [ ] Campaign editing
* [ ] Campaign persistence

## Phase 3 — Players

* [ ] Player management
* [ ] Image management
* [ ] Health
* [ ] Status effects
* [ ] Player cards

## Phase 4 — Campaign Book

* [ ] Overview
* [ ] NPCs
* [ ] Locations
* [ ] Quests
* [ ] Factions
* [ ] Notes
* [ ] Relationships
* [ ] Search
* [ ] Quick Add

## Phase 5 — Playing

* [ ] Live player state
* [ ] Campaign Book slide-over
* [ ] Quick Add from Playing
* [ ] Session system
* [ ] Session events

## Phase 6 — OBS

* [ ] Local web server
* [ ] WebSocket
* [ ] Overlay
* [ ] State synchronization
* [ ] Animations
* [ ] Overlay configuration

## Phase 7 — Reliability

* [ ] Automatic backups
* [ ] Export/import
* [ ] Error handling
* [ ] Recovery
* [ ] Performance optimization

## Phase 8 — Polish

* [ ] UI refinement
* [ ] Keyboard navigation
* [ ] Empty states
* [ ] Loading states
* [ ] Accessibility
* [ ] Packaging
* [ ] Installation

---

# 56. Critical UX Principle

GM Nexus should optimize for **low cognitive load during live gameplay**.

The GM should not have to think:

> "Which menu contains the thing I need?"

The GM should think:

> "I need to add Martha."

Then:

**Quick Add → NPC → Martha → Create**

Done.

Similarly:

> "Aria took 3 damage."

Then:

**Aria → -3**

Done.

And:

> "What was that NPC's name?"

Then:

**Ctrl + K → search → result**

Done.

---

# 57. Critical Design Principle

The Campaign Book and Playing screen must feel like two sides of the same application.

They are not separate products.

```text id="c6x2w9"
              GM NEXUS
                  │
        ┌─────────┴─────────┐
        │                   │
   CAMPAIGN BOOK          PLAY
        │                   │
   World knowledge      Live state
        │                   │
        └─────────┬─────────┘
                  │
             OBS OVERLAY
```

A GM should be able to move between them instantly.

---

# 58. Core User Journey

The ideal GM workflow is:

```text id="m8q2x4"
OPEN GM NEXUS
      ↓
SELECT CAMPAIGN
      ↓
REVIEW CAMPAIGN OVERVIEW
      ↓
START SESSION
      ↓
OPEN PLAYING SCREEN
      ↓
TRACK PLAYER STATE
      │
      ├── Change HP
      ├── Add status
      ├── Add NPC
      ├── Add location
      ├── Add quest
      ├── Add session event
      └── Open campaign information
      ↓
OBS UPDATES AUTOMATICALLY
      ↓
END SESSION
      ↓
SESSION SAVED
      ↓
CAMPAIGN KNOWLEDGE UPDATED
```

---

# 59. Product Identity

GM Nexus should feel like:

**A GM's command center.**

It should combine:

* The organization of a wiki
* The flexibility of a notes application
* The speed of a live game dashboard
* The connectivity of a streaming overlay

without becoming a full virtual tabletop.

The most important differentiator is the ability to **capture improvised campaign information while the game is happening**.

An improvised NPC should be able to become a permanent part of the campaign in seconds.

An improvised location should immediately be connected to the relevant NPCs and quests.

A session event should become part of the campaign history.

The campaign should naturally become more organized every time it is played.

---

# 60. Final Acceptance Criteria

A successful MVP should support this complete workflow:

1. Create a D&D campaign.
2. Add four players.
3. Give each player a name and image.
4. Set their health.
5. Start a session.
6. Open the Playing screen.
7. See all player portraits, health bars, HP and status effects.
8. Change health with quick buttons.
9. Add/remove status effects.
10. Open the Campaign Book without leaving the Playing screen.
11. Create an NPC during gameplay.
12. Create a location during gameplay.
13. Create a quest during gameplay.
14. Connect the NPC, location and quest.
15. Add a session event.
16. Search for campaign information.
17. Return immediately to the player tracker.
18. Connect OBS using a Browser Source.
19. See all players in the overlay.
20. See their portraits, health and status effects.
21. Change player health.
22. See the OBS health bar animate.
23. Add/remove status effects.
24. See OBS update automatically.
25. End the session.
26. Preserve all session information.
27. Close and reopen GM Nexus.
28. Everything remains saved.

---

# 61. Final Instruction to the Development Agent

Build GM Nexus incrementally.

Do not attempt to implement every future feature at once.

First establish a robust foundation around:

* Campaigns
* Players
* Campaign entities
* Relationships
* Sessions
* Game state
* Local persistence

Then build the interfaces on top of that foundation.

Do not sacrifice architecture for speed of initial implementation.

The core application should remain extensible enough to support future TTRPG systems and future GM tools.

The most important design principle is:

> **GM Nexus should make it easier for the GM to think, improvise, remember, and run the game — not make the GM spend time managing the software.**

The final product should feel like a natural extension of the GM's thought process:

**Think → Create → Link → Play → Record → Remember.**
