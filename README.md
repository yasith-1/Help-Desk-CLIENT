# 🖥️ HelpDesk UI — Angular Frontend (Sinhala)

`HelpDesk API` (ASP.NET Core) backend එකට match වෙන Angular 18 UI එක.
**Login/Register · Dashboard · Ticket list + Kanban board · Ticket detail (conversation) ·
Admin panels** — සම්පූර්ණ ticket management system එකක frontend එක.

---

## ✅ Screens / Features

- **Login + Register** — JWT auth; customer කෙනෙකුට self-register වෙන්න පුළුවන්
- **Dashboard** (role-aware) — stat cards (open/overdue/unassigned/resolved…) + charts (by status/priority) + recent tickets
- **Ticket list** — search + filters (status/priority/category/assignee) + sort + pagination
- **Kanban board** — columns by status; **agent/admin ට card drag කරලා status මාරු** කරන්න
- **Ticket detail** — description + conversation (public replies + 🔒 internal notes) + properties panel (status/priority/assignee inline change) + activity timeline
- **New / Edit ticket** — client-side validation එක්ක
- **Admin: Users** — accounts හදන්න, role මාරු, activate/deactivate
- **Admin: Categories** — CRUD (default priority + SLA)
- **Role-based UI** — admin links, internal notes, assignee controls role එක අනුව පෙන්නනවා/හංගනවා
- JWT interceptor (token ඉබේම) · auth guard + role guard · toasts · light/dark theme aware

---

## 🚀 Run කරන විදිහ

### අවශ්‍ය දේ
- [Node.js 18+](https://nodejs.org)
- Backend එක (`ProductApi`) **run වෙමින්** (http://localhost:5000) — CORS එක දැනටම enable කරලා තියෙනවා

### පියවර
```bash
cd product-ui
npm install
npm start
```

Browser එකේ: **http://localhost:4200** 🎉

### Demo accounts
| Role | login |
|------|-------|
| Admin | `admin / admin123` |
| Agent | `nimal / nimal123` |
| Customer | `kamal / kamal123` |

---

## 🧪 Test flow (නියම අත්දැකීම)

1. **Customer** (`kamal`) → login → "Raise a new ticket" → ticket එකක් දානවා → තමන්ගේ tickets විතරක් පේනවා
2. **Agent** (`nimal`) → login → Dashboard → Tickets → **Board** view → card එකක් drag කරලා status මාරු
3. Ticket එකක් open → assignee/priority/status මාරු · **public reply** එකක් · **🔒 internal note** එකක්
4. ආපහු **customer** → එම ticket එකේ → reply එක පේනවා, **internal note එක පේන්නේ නෑ**
5. **Admin** → Users (role මාරු / account හදන්න) · Categories (අලුත් category)

---

## 📂 ව්‍යුහය

```
product-ui/src/app/
├── app.config.ts / app.routes.ts / app.component.ts   # providers · routes (lazy) · shell(sidebar+topbar+toasts)
├── models/models.ts                                    # interfaces + enums (backend DTOs match)
├── services/
│   ├── auth.service.ts        # login/register/token (signals: role, userId…)
│   ├── ticket.service.ts      # ticket CRUD + status/assign/comments
│   ├── category.service.ts  user.service.ts  dashboard.service.ts
│   └── toast.service.ts
├── interceptors/auth.interceptor.ts   # JWT header + 401 → logout
├── guards/ auth.guard.ts · role.guard.ts   # login + role-based route protection
└── components/
    ├── login · register
    ├── dashboard
    ├── ticket-list (table + Kanban) · ticket-form (new/edit) · ticket-detail
    └── admin-users · admin-categories
```

## 🎨 Design — Shadcn-style (Tailwind)

Premium, commercial-grade UI built with **Tailwind CSS + Shadcn design tokens** (Shadcn/ui වලට
Angular official port එකක් නැති නිසා, Shadcn ගේ core එකම — Tailwind + CSS-variable tokens — අතින්
replicate කරලා). **Dark + Light theme toggle** (sidebar එකේ පහළ; default dark, localStorage persist).

- Tokens: `src/styles.css` (`:root` light + `.dark` dark, HSL) · config: `tailwind.config.js`
  (`darkMode:'class'`, token→`hsl(var(--…))` mapping, `safelist` for dynamic status/priority pills).
- Shared UI components: `src/app/components/ui/` — `avatar`, `avatar-stack`, `stat-card`,
  `line-chart` (**inline SVG**, gradient + hover tooltip), `donut`. No chart library (reliable).
- `ThemeService` (`services/theme.service.ts`) toggles `.dark` on `<html>`.
- Shell: icon sidebar + search topbar + notifications + user chip. Dashboard mirrors a modern
  SaaS layout (overview chart + hero KPI + recent-tickets table with avatars/pills).

> Build: `npm run build` → `dist/product-ui` (production). `npm start` → dev at :4200.

---

## 🔧 Angular ↔ Spring/Java සංසන්දනය

| Angular | සමාන අදහස |
|---------|-----------|
| `Service` (`@Injectable`) | Spring `@Service` |
| `inject()` | Spring DI |
| `HttpClient` | RestTemplate |
| `Interceptor` | client-side filter |
| `Guard` | route-level security |
| `signal()` | reactive state |

---

*Backend එක `../ProductApi`. මේ project එක Claude සමඟ ගොඩනගන ලදී. 🎉*
